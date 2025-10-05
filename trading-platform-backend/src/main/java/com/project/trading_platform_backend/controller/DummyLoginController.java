package com.project.trading_platform_backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DummyLoginController {
    @GetMapping("/login")
    public String login() {
        return "forward:/index.html";
    }
}
