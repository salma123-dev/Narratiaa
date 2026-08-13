package com.narratiaa.library;

import com.narratiaa.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.sql.*;
import java.time.*;
import java.util.*;

@Service
public class LibraryService {
  private final JdbcTemplate db;
  public LibraryService(JdbcTemplate db){this.db=db;}
  private static final Set<String> STATUSES=Set.of("want_to_read","reading","completed","abandoned");
  private static final String BOOK="SELECT id,title,author,genre,description,cover_url,total_pages,current_page,status,favorite,started_at,finished_at,created_at,updated_at FROM books";
  private String s(Object v){return v==null?"":String.valueOf(v).trim();} private int n(Object v,int fallback){try{return v==null?fallback:Integer.parseInt(String.valueOf(v));}catch(Exception e){return fallback;}}
  private Map<String,Object> book(ResultSet r)throws SQLException{var m=new LinkedHashMap<String,Object>();m.put("id",r.getLong(1));m.put("title",r.getString(2));m.put("author",r.getString(3));m.put("genre",r.getString(4));m.put("description",r.getString(5));m.put("coverUrl",r.getString(6));m.put("totalPages",r.getInt(7));m.put("currentPage",r.getInt(8));m.put("status",r.getString(9));m.put("favorite",r.getInt(10)!=0);m.put("startedAt",r.getObject(11));m.put("finishedAt",r.getObject(12));m.put("createdAt",r.getObject(13));m.put("updatedAt",r.getObject(14));return m;}
  public List<Map<String,Object>> books(long uid){return db.query(BOOK+" WHERE user_id=? ORDER BY favorite DESC,updated_at DESC",(r,n)->book(r),uid);}
  public Map<String,Object> book(long uid,long id){var x=db.query(BOOK+" WHERE user_id=? AND id=?",(r,n)->book(r),uid,id);return x.isEmpty()?null:x.getFirst();}
  public Map<String,Object> requireBook(long uid,long id){var b=book(uid,id);if(b==null)throw new ApiException(HttpStatus.NOT_FOUND,"Book not found.");return b;}
  public Map<String,Object> normalize(Map<String,Object> body,Map<String,Object> old){
    if(old==null)old=Map.of();int total=Math.max(1,n(body.get("totalPages"),n(old.get("totalPages"),1)));int page=Math.min(total,Math.max(0,n(body.get("currentPage"),n(old.get("currentPage"),0))));String status=s(body.get("status"));if(!STATUSES.contains(status))status=s(old.get("status"));if(status.isBlank())status="want_to_read";if(page>=total)status="completed";
    var b=new LinkedHashMap<String,Object>();b.put("title",body.containsKey("title")?s(body.get("title")):s(old.get("title")));b.put("author",body.containsKey("author")?s(body.get("author")):s(old.get("author")));for(String k:new String[]{"genre","description","coverUrl"})b.put(k,body.containsKey(k)?s(body.get(k)):s(old.get(k)));b.put("totalPages",total);b.put("currentPage",page);b.put("status",status);b.put("favorite",body.containsKey("favorite")?Boolean.TRUE.equals(body.get("favorite")):Boolean.TRUE.equals(old.get("favorite")));
    Object started=body.containsKey("startedAt")?body.get("startedAt"):old.get("startedAt");if(started==null&&status.equals("reading"))started=LocalDate.now();b.put("startedAt",started);Object finished=status.equals("completed")?(body.containsKey("finishedAt")?body.get("finishedAt"):Optional.ofNullable(old.get("finishedAt")).orElse(LocalDate.now())):null;b.put("finishedAt",finished);return b;
  }
  public Map<String,Object> create(long uid,Map<String,Object> body){var b=normalize(body,null);if(s(b.get("title")).isBlank()||s(b.get("author")).isBlank())throw new ApiException(HttpStatus.BAD_REQUEST,"Title and author are required.");var dupe=db.query("SELECT id FROM books WHERE user_id=? AND lower(trim(title))=lower(trim(?)) AND lower(trim(author))=lower(trim(?))",(r,n)->r.getLong(1),uid,b.get("title"),b.get("author"));if(!dupe.isEmpty())throw new ApiException(HttpStatus.CONFLICT,"This book is already in your library.",Map.of("duplicateId",String.valueOf(dupe.getFirst())));Long id=db.queryForObject("INSERT INTO books(user_id,title,author,genre,description,cover_url,total_pages,current_page,status,favorite,started_at,finished_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id",Long.class,uid,b.get("title"),b.get("author"),b.get("genre"),b.get("description"),b.get("coverUrl"),b.get("totalPages"),b.get("currentPage"),b.get("status"),Boolean.TRUE.equals(b.get("favorite"))?1:0,date(b.get("startedAt")),date(b.get("finishedAt")));return book(uid,id);}
  public Map<String,Object> update(long uid,long id,Map<String,Object> body){var b=normalize(body,requireBook(uid,id));db.update("UPDATE books SET title=?,author=?,genre=?,description=?,cover_url=?,total_pages=?,current_page=?,status=?,favorite=?,started_at=?,finished_at=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND id=?",b.get("title"),b.get("author"),b.get("genre"),b.get("description"),b.get("coverUrl"),b.get("totalPages"),b.get("currentPage"),b.get("status"),Boolean.TRUE.equals(b.get("favorite"))?1:0,date(b.get("startedAt")),date(b.get("finishedAt")),uid,id);return book(uid,id);}
  private LocalDate date(Object v){if(v==null||s(v).isBlank())return null;if(v instanceof LocalDate d)return d;return LocalDate.parse(s(v).substring(0,10));}
  public Map<String,Object> session(ResultSet r)throws SQLException{var m=new LinkedHashMap<String,Object>();m.put("id",r.getLong(1));m.put("bookId",r.getLong(2));m.put("startPage",r.getInt(3));m.put("endPage",r.getInt(4));m.put("minutes",r.getInt(5));m.put("readAt",r.getObject(6));m.put("createdAt",r.getObject(7));return m;}
  public Map<String,Object> getSession(long uid,long id){var x=db.query("SELECT id,book_id,start_page,end_page,minutes,read_at,created_at FROM reading_sessions WHERE user_id=? AND id=?",(r,n)->session(r),uid,id);return x.isEmpty()?null:x.getFirst();}
  public Map<String,Object> refresh(long uid,long bookId){var b=requireBook(uid,bookId);var pages=db.query("SELECT end_page FROM reading_sessions WHERE user_id=? AND book_id=? ORDER BY read_at DESC,id DESC LIMIT 1",(r,n)->r.getInt(1),uid,bookId);int page=pages.isEmpty()?0:pages.getFirst();String status=page>=n(b.get("totalPages"),1)?"completed":page>0?"reading":"abandoned".equals(b.get("status"))?"abandoned":"want_to_read";db.update("UPDATE books SET current_page=?,status=?,finished_at=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND id=?",page,status,status.equals("completed")?Optional.ofNullable(b.get("finishedAt")).orElse(LocalDate.now()):null,uid,bookId);return book(uid,bookId);}
}
