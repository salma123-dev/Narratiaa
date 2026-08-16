package com.narratiaa.config;

import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.stereotype.Controller;import org.springframework.web.bind.annotation.*;import java.util.*;

@Controller
public class ApplicationController {
  private final JdbcTemplate db;public ApplicationController(JdbcTemplate db){this.db=db;}
  @GetMapping("/api/health")@ResponseBody Map<String,String> health(){db.queryForObject("SELECT 1",Integer.class);return Map.of("status","ok","database","postgres");}
  @GetMapping({"/","/signin","/signup","/forgot-password","/dashboard","/library","/journal","/stats","/onboarding","/books/{id}"})String spa(){return "forward:/index.html";}
}
