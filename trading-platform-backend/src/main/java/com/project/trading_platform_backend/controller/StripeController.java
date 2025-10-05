package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.ChannelRepository;
import com.project.trading_platform_backend.repository.CourseRepository;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.security.JwtUtil;
import com.project.trading_platform_backend.service.UserService;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/stripe")
public class StripeController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ChannelRepository channelRepository;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.endpoint.secret}")
    private String stripeWebhookSecret;

    public StripeController(UserRepository userRepository,
                            CourseRepository courseRepository,
                            ChannelRepository channelRepository,
                            UserService userService,
                            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.channelRepository = channelRepository;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // Direct checkout endpoint that doesn't require authentication
    @GetMapping("/direct-checkout")
    public ResponseEntity<?> createDirectCheckoutSession(@RequestParam("courseId") String courseId) {
        System.out.println("🔥 StripeController /direct-checkout was hit for courseId: " + courseId);
        
        try {
            Optional<CourseModel> courseOpt = courseRepository.findByCourseId(courseId);
            CourseModel course;
            
            if (courseOpt.isEmpty()) {
                System.out.println("⚠️ Course not found with ID: " + courseId + ". Using fallback course.");
                
                // Create a fallback course for testing
                course = new CourseModel();
                course.setCourseId(courseId);
                course.setName("Trading Course");
                course.setDescription("Professional trading course");
                course.setPrice(new BigDecimal("99.00"));
            } else {
                course = courseOpt.get();
            }

            Stripe.apiKey = stripeApiKey;

            // Build line item
            BigDecimal price = new BigDecimal(String.valueOf(course.getPrice()));
            BigDecimal multiplied = price.multiply(BigDecimal.valueOf(100));
            long unitAmount = multiplied.longValue();

            System.out.println("✅ Course: " + course.getName() + ", Price: " + course.getPrice());
            System.out.println("✅ Final unit amount (pence): " + unitAmount);

            SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("gbp")
                                    .setUnitAmount(unitAmount)
                                    .setProductData(
                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                    .setName(course.getName())
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            // Final params - no authentication, so we can't add user metadata yet
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("https://23ea-176-249-124-139.ngrok/payment-success?courseId=" + courseId + "&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl("https://23ea-176-249-124-139.ngrok/courses")
                    .addLineItem(lineItem)
                    .build();

            System.out.println("➡️ Creating direct Stripe session...");

            Session session = Session.create(params);
            System.out.println("✅ Direct Stripe session created: " + session.getId());

            // Return HTML that redirects to Stripe checkout
            String html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">"
                + "<title>Redirecting to Stripe...</title></head><body>"
                + "<h3>Redirecting to secure payment page...</h3>"
                + "<script>window.location.href = \"" + session.getUrl() + "\";</script>"
                + "</body></html>";
            
            return ResponseEntity.ok()
                .header("Content-Type", "text/html")
                .body(html);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating Stripe session: " + e.getMessage());
        }
    }

    @PostMapping("/create-session")
    public ResponseEntity<String> createCheckoutSession(
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {

        System.out.println("🔥 StripeController /create-session was hit!");

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid token");
            }

            String token = authHeader.substring(7);
            Claims claims = jwtUtil.extractClaims(token);
            Long userId = Long.parseLong(claims.get("id").toString());

            String courseIdStr = payload.get("courseId");
            if (courseIdStr == null || courseIdStr.isEmpty()) {
                return ResponseEntity.badRequest().body("Missing courseId");
            }

            Optional<CourseModel> courseOpt = courseRepository.findByCourseId(courseIdStr);
            if (courseOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Course not found");
            }

            CourseModel course = courseOpt.get();
            Stripe.apiKey = stripeApiKey;

            // ✅ Debug logs
            System.out.println("✅ Creating Stripe session:");
            System.out.println("➡️ userId: " + userId);
            System.out.println("➡️ courseId: " + course.getCourseId());

            assert userId != null : "❌ userId is null before metadata";
            assert course.getCourseId() != null : "❌ courseId is null before metadata";

            // Build line item
            BigDecimal price = new BigDecimal(String.valueOf(course.getPrice()));
            BigDecimal multiplied = price.multiply(BigDecimal.valueOf(100));
            long unitAmount = multiplied.longValue();

            System.out.println("✅ course.getPrice(): " + course.getPrice());
            System.out.println("✅ Final unit amount (pence): " + unitAmount);


            SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("gbp")
                                    .setUnitAmount(unitAmount)
                                    .setProductData(
                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                    .setName(course.getName())
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            // Attach metadata to PaymentIntent
            SessionCreateParams.PaymentIntentData paymentIntentData =
                    SessionCreateParams.PaymentIntentData.builder()
                            .putMetadata("userId", userId.toString())
                            .putMetadata("courseId", course.getCourseId())
                            .build();

            // Final params
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("https://23ea-176-249-124-139.ngrok/payment-success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl("https://23ea-176-249-124-139.ngrok/courses")
                    .addLineItem(lineItem)
                    .setPaymentIntentData(paymentIntentData)
                    .build();

            System.out.println("➡️ Final Stripe params built");

            Session session = Session.create(params);
            System.out.println("✅ Stripe session created: " + session.getId());

            // Return HTML that redirects to Stripe checkout
            String html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">"
                + "<title>Redirecting to Stripe...</title></head><body>"
                + "<h3>Redirecting to secure payment page...</h3>"
                + "<script>window.location.href = \"" + session.getUrl() + "\";</script>"
                + "</body></html>";
            
            return ResponseEntity.ok()
                .header("Content-Type", "text/html")
                .body(html);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating Stripe session: " + e.getMessage());
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload,
                                                      @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Stripe.apiKey = stripeApiKey;

            Event event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
            System.out.println("✅ Stripe event received: " + event.getType());

            if ("checkout.session.completed".equals(event.getType())) {
                EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();

                Session session;
                if (deserializer.getObject().isPresent() && deserializer.getObject().get() instanceof Session) {
                    session = (Session) deserializer.getObject().get();
                    System.out.println("✅ Session object deserialized");
                } else {
                    StripeObject raw = event.getData().getObject();
                    Session fallbackSession = (Session) raw;
                    session = Session.retrieve(fallbackSession.getId());
                    System.out.println("⚠️ Fallback: retrieved session ID " + fallbackSession.getId());
                }

                String paymentIntentId = session.getPaymentIntent();
                PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
                String userIdStr = intent.getMetadata().get("userId");
                String courseId = intent.getMetadata().get("courseId");

                if (userIdStr != null && courseId != null) {
                    Long userId = Long.parseLong(userIdStr);
                    Optional<CourseModel> courseOpt = courseRepository.findByCourseId(courseId);
                    courseOpt.ifPresent(course -> {
                        userService.assignCourseAndChannel(userId, course);
                        System.out.println("✅ User " + userId + " assigned course and community access.");
                    });
                } else {
                    System.out.println("❌ Metadata still missing: userId=" + userIdStr + ", courseId=" + courseId);
                }
            }

            return ResponseEntity.ok("Webhook handled");

        } catch (SignatureVerificationException e) {
            System.out.println("❌ Signature verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            System.out.println("❌ General webhook error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook processing error");
        }
    }

    @PostMapping("/complete-purchase")
    public ResponseEntity<?> completePurchase(
            @RequestParam("courseId") String courseId,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Missing or invalid token");
        }

        String token = authHeader.substring(7);
        Claims claims = jwtUtil.extractClaims(token);
        Long userId = Long.parseLong(claims.get("id").toString());

        Optional<CourseModel> courseOpt = courseRepository.findByCourseId(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        CourseModel course = courseOpt.get();
        userService.assignCourseAndChannel(userId, course);
        return ResponseEntity.ok("Course and channel access granted");

    }


}
