package com.narratiaa.library;

import com.narratiaa.auth.AuthService;
import com.narratiaa.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@RestController @RequestMapping("/api")
public class LibraryController {
  private final AuthService auth;private final LibraryService lib;private final JdbcTemplate db;
  public LibraryController(AuthService auth,LibraryService lib,JdbcTemplate db){this.auth=auth;this.lib=lib;this.db=db;}
  private long uid(HttpServletRequest r){return auth.requireUser(r).id();}
  @GetMapping("/books") Map<String,Object> books(HttpServletRequest r){return Map.of("books",lib.books(uid(r)));}
  @PostMapping("/books") ResponseEntity<Map<String,Object>> create(HttpServletRequest r,@RequestBody Map<String,Object>b){return ResponseEntity.status(201).body(Map.of("book",lib.create(uid(r),b)));}
  @GetMapping("/books/{id}") Map<String,Object> book(HttpServletRequest r,@PathVariable long id){long u=uid(r);var sessions=db.query("SELECT id,book_id,start_page,end_page,minutes,read_at,created_at FROM reading_sessions WHERE user_id=? AND book_id=? ORDER BY read_at DESC,id DESC",(x,n)->lib.session(x),u,id);return Map.of("book",lib.requireBook(u,id),"sessions",sessions);}
  @PutMapping("/books/{id}") Map<String,Object> update(HttpServletRequest r,@PathVariable long id,@RequestBody Map<String,Object>b){return Map.of("book",lib.update(uid(r),id,b));}
  @DeleteMapping("/books/{id}") Map<String,String> delete(HttpServletRequest r,@PathVariable long id){if(db.update("DELETE FROM books WHERE user_id=? AND id=?",uid(r),id)==0)throw new ApiException(HttpStatus.NOT_FOUND,"Book not found.");return Map.of("message","Book deleted.");}
  @PostMapping("/books/{id}/sessions") ResponseEntity<Map<String,Object>> addSession(HttpServletRequest r,@PathVariable long id,@RequestBody Map<String,Object>b){long u=uid(r);var book=lib.requireBook(u,id);int current=(int)book.get("currentPage"),total=(int)book.get("totalPages");int end=Math.min(total,Math.max(current,number(b.get("endPage"),current)));int minutes=Math.max(1,number(b.get("minutes"),1));OffsetDateTime at=parseTime(b.get("readAt"));Long sid=db.queryForObject("INSERT INTO reading_sessions(user_id,book_id,start_page,end_page,minutes,read_at) VALUES(?,?,?,?,?,?) RETURNING id",Long.class,u,id,current,end,minutes,at);lib.update(u,id,Map.of("currentPage",end,"status",end>=total?"completed":"reading"));return ResponseEntity.status(201).body(Map.of("session",lib.getSession(u,sid),"book",lib.book(u,id)));}
  @GetMapping("/reading-sessions/{id}") Map<String,Object> session(HttpServletRequest r,@PathVariable long id){var s=lib.getSession(uid(r),id);if(s==null)throw new ApiException(HttpStatus.NOT_FOUND,"Reading session not found.");return Map.of("session",s);}
  @PutMapping("/reading-sessions/{id}") Map<String,Object> updateSession(HttpServletRequest r,@PathVariable long id,@RequestBody Map<String,Object>b){long u=uid(r);var s=lib.getSession(u,id);if(s==null)throw new ApiException(HttpStatus.NOT_FOUND,"Reading session not found.");var book=lib.requireBook(u,(long)s.get("bookId"));int end=Math.min((int)book.get("totalPages"),Math.max((int)s.get("startPage"),number(b.get("endPage"),(int)s.get("endPage"))));int minutes=Math.max(1,number(b.get("minutes"),(int)s.get("minutes")));Object at=b.containsKey("readAt")?parseTime(b.get("readAt")):s.get("readAt");db.update("UPDATE reading_sessions SET end_page=?,minutes=?,read_at=? WHERE user_id=? AND id=?",end,minutes,at,u,id);return Map.of("session",lib.getSession(u,id),"book",lib.refresh(u,(long)s.get("bookId")));}
  @DeleteMapping("/reading-sessions/{id}") Map<String,Object> deleteSession(HttpServletRequest r,@PathVariable long id){long u=uid(r);var s=lib.getSession(u,id);if(s==null)throw new ApiException(HttpStatus.NOT_FOUND,"Reading session not found.");db.update("DELETE FROM reading_sessions WHERE user_id=? AND id=?",u,id);return Map.of("message","Reading session deleted.","book",lib.refresh(u,(long)s.get("bookId")));}
  private int number(Object v,int d){try{return v==null?d:Integer.parseInt(String.valueOf(v));}catch(Exception e){return d;}}
  private OffsetDateTime parseTime(Object v){if(v==null||String.valueOf(v).isBlank())return OffsetDateTime.now(ZoneOffset.UTC);try{return OffsetDateTime.parse(String.valueOf(v));}catch(Exception e){return LocalDateTime.parse(String.valueOf(v)).atOffset(ZoneOffset.UTC);}}
}
