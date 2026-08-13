package com.narratiaa.common;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(ApiException.class)
  ResponseEntity<Map<String,Object>> api(ApiException e) {
    var body=new LinkedHashMap<String,Object>(); body.put("message",e.getMessage()); if(e.errors()!=null) body.put("errors",e.errors());
    return ResponseEntity.status(e.status()).body(body);
  }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String,Object>> validation(MethodArgumentNotValidException e) {
    var errors=new LinkedHashMap<String,String>(); e.getBindingResult().getFieldErrors().forEach(x->errors.putIfAbsent(x.getField(),x.getDefaultMessage()));
    return ResponseEntity.badRequest().body(Map.of("message","Check the form fields.","errors",errors));
  }
  @ExceptionHandler(Exception.class)
  ResponseEntity<Map<String,String>> unexpected(Exception e) {
    e.printStackTrace(); return ResponseEntity.status(500).body(Map.of("message","An unexpected server error occurred."));
  }
}
