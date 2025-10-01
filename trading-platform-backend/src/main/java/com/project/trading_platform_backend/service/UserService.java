package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.model.LevelModel;
import com.project.trading_platform_backend.model.User;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for user-related operations
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageRepository messageRepository;

    @Autowired
    private ChannelRepository channelRepository;

    @Autowired
    private LevelRepository levelRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       MessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.messageRepository = messageRepository;
    }

    public List<UserModel> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<UserModel> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean updateUserRole(Long userId, String newRole) {
        Optional<UserModel> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            UserModel user = optionalUser.get();
            user.setRole(newRole);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    public boolean muteUser(Long userId, boolean mute) {
        Optional<UserModel> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            UserModel user = optionalUser.get();
            user.setMuted(mute);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    public boolean assignCourseToUser(Long userId, CourseModel course) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty() || course == null) return false;

        UserModel user = userOpt.get();
        Set<CourseModel> userCourses = user.getCourses();
        if (userCourses == null) userCourses = new HashSet<>();

        if (!userCourses.contains(course)) {
            userCourses.add(course);
            user.setCourses(userCourses);

            if (!user.isAdmin()) {
                user.setRole("PREMIUM");
            }

            userRepository.save(user);
            System.out.println("Assigned course to user: " + user.getEmail());
            return true;
        }

        return false;
    }

    public boolean deleteMessageAsAdmin(Long messageId) {
        return messageRepository.findById(messageId).map(msg -> {
            messageRepository.deleteById(messageId);
            return true;
        }).orElse(false);
    }

    public int getUserLevel(Long userId) {
        return levelRepository.findById(userId)
                .map(LevelModel::getLevel)
                .orElse(1); // Default to level 1
    }

    @Transactional
    public void assignCourseAndChannel(Long userId, CourseModel course) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        Optional<ChannelModel> channelOpt = channelRepository.findByCourse(course);

        if (userOpt.isPresent()) {
            UserModel user = userOpt.get();
            boolean courseAdded = false;

            if (!user.getCourses().contains(course)) {
                user.getCourses().add(course);
                courseAdded = true;
            }

            if (courseAdded && !user.isAdmin()) {
                user.setRole("PREMIUM");
            }

            userRepository.save(user);

            channelOpt.ifPresent(channel -> {
                if (!channel.getUsers().contains(user)) {
                    channel.getUsers().add(user);
                    channelRepository.save(channel);
                    System.out.println("🔓 Channel access granted for course: " + course.getTitle());
                }
            });
        }
    }

    /**
     * Load user for Spring Security authentication
     * @param username The username (email)
     * @return UserDetails for authentication
     * @throws UsernameNotFoundException if user not found
     */
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserModel> userOpt = userRepository.findByEmail(username);
        
        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        
        UserModel user = userOpt.get();
        
        List<SimpleGrantedAuthority> authorities = Arrays.asList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole())
        );
        
        return new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getPassword(),
            authorities
        );
    }
    
    /**
     * Find user by ID
     * @param userId User ID
     * @return Optional containing the user if found
     */
    public Optional<UserModel> findById(Long userId) {
        return userRepository.findById(userId);
    }

    /**
     * Find user by username
     * @param username the username to search for
     * @return the user if found
     */
    public User findByUsername(String username) {
        Optional<?> result = userRepository.findByUsername(username);
        if (result.isPresent() && result.get() instanceof UserModel) {
            UserModel userModel = (UserModel) result.get();
            return new User(userModel);
        }
        return null;
    }

    /**
     * Find user by email
     * @param email the email to search for
     * @return the user if found
     */
    public User findByEmail(String email) {
        Optional<?> result = userRepository.findByEmail(email);
        if (result.isPresent() && result.get() instanceof UserModel) {
            UserModel userModel = (UserModel) result.get();
            return new User(userModel);
        }
        return null;
    }

    /**
     * Save a user
     * @param user the user to save
     * @return the saved user
     */
    public User save(User user) {
        // Create a new UserModel with the same properties as the User
        UserModel userModel = new UserModel();
        userModel.setId(user.getId());
        userModel.setUsername(user.getUsername());
        userModel.setEmail(user.getEmail());
        // Encode the password before saving
        userModel.setPassword(passwordEncoder.encode(user.getPassword()));
        userModel.setRole(user.getRole());
        userModel.setName(user.getName());
        userModel.setAddress(user.getAddress());
        userModel.setPhone(user.getPhone());
        userModel.setAvatar(user.getAvatar());
        
        UserModel savedModel = userRepository.save(userModel);
        return new User(savedModel);
    }
}
