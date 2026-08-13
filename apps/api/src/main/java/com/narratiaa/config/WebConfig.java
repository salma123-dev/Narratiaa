package com.narratiaa.config;

import com.narratiaa.auth.AuthenticationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final AuthenticationInterceptor interceptor;
  public WebConfig(AuthenticationInterceptor interceptor){this.interceptor=interceptor;}
  @Override public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(interceptor).addPathPatterns("/api/**");}
}
