package beginningdotgg.controller;

import beginningdotgg.security.JwtTokenProvider;
import beginningdotgg.service.DiscordUserService;
import beginningdotgg.service.dto.DiscordUserDTO;
import beginningdotgg.service.dto.LoginResponse;
import beginningdotgg.service.dto.UserMessageDTO;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "https://beginning.gg/", maxAge = 3600, allowCredentials = "true")
public class DiscordUserController {

    private final DiscordUserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    public DiscordUserController(DiscordUserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private MediaType determineMediaType(String path, String category) {
        String lower = path.toLowerCase();

        if ("image".equals(category)) {
            if (lower.contains(".png")) return MediaType.IMAGE_PNG;
            if (lower.contains(".gif")) return MediaType.IMAGE_GIF;
            if (lower.contains(".webp")) return MediaType.parseMediaType("image/webp");
            if (lower.contains(".svg")) return MediaType.parseMediaType("image/svg+xml");
            return MediaType.IMAGE_JPEG; // Default for images
        } else if ("audio".equals(category)) {
            if (lower.contains(".mp3")) return MediaType.parseMediaType("audio/mpeg");
            if (lower.contains(".wav")) return MediaType.parseMediaType("audio/wav");
            if (lower.contains(".ogg")) return MediaType.parseMediaType("audio/ogg");
            if (lower.contains(".webm")) return MediaType.parseMediaType("audio/webm");
            if (lower.contains(".m4a")) return MediaType.parseMediaType("audio/mp4");
            return MediaType.parseMediaType("audio/mpeg"); // Default for audio
        }

        return MediaType.APPLICATION_OCTET_STREAM; // Fallback
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestParam String loginName,
            @RequestParam String password
    ) {
        try {
            DiscordUserDTO userDto = userService.loginOrCreateUser(loginName, password);
            String jwtToken = jwtTokenProvider.generateToken(userDto.getLoginName());
            LoginResponse response = new LoginResponse(userDto, jwtToken);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/{userId}/messages")
    public ResponseEntity<UserMessageDTO> createMessage(
            @PathVariable Long userId,
            @RequestParam(required = false) String text,
            @RequestParam(required = false) MultipartFile recording,
            @RequestParam(required = false) MultipartFile image
    ) {
        try {
            UserMessageDTO message = userService.createMessage(userId, text, recording, image);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{userId}/messages/{messageId}")
    public ResponseEntity<UserMessageDTO> modifyMessage(
            @PathVariable Long userId,
            @PathVariable Long messageId,
            @RequestParam String newText
    ) {
        try {
            UserMessageDTO message = userService.modifyMessage(userId, messageId, newText);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PutMapping("/{userId}/messages/{messageId}/files")
    public ResponseEntity<UserMessageDTO> replaceMessageFiles(
            @PathVariable Long userId,
            @PathVariable Long messageId,
            @RequestParam(required = false) MultipartFile recording,
            @RequestParam(required = false) MultipartFile image
    ) {
        try {
            UserMessageDTO message = userService.replaceMessageFile(userId, messageId, recording, image);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{userId}/messages")
    public ResponseEntity<List<UserMessageDTO>> getUserMessages(@PathVariable Long userId) {
        try {
            List<UserMessageDTO> messages = userService.getUserMessages(userId);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/messages")
    public ResponseEntity<List<UserMessageDTO>> getAllMessages() {
        List<UserMessageDTO> messages = userService.getAllMessages();
        return ResponseEntity.ok(messages);
    }

    @CrossOrigin(
            origins = "https://beginning.gg/",
            allowCredentials = "true",
            methods = {RequestMethod.GET, RequestMethod.OPTIONS}
    )
    @GetMapping("/messages/{messageId}/image")
    public ResponseEntity<ByteArrayResource> serveImage(@PathVariable Long messageId) {
        try {
            byte[] fileBytes = userService.retrieveFile(messageId, "image");

            MediaType contentType = MediaType.IMAGE_JPEG;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(contentType);
            headers.setCacheControl("public, max-age=3600");
            headers.setContentLength(fileBytes.length);
            headers.set("Access-Control-Allow-Origin", "https://api.beginning.gg/");

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(new ByteArrayResource(fileBytes));

        } catch (Exception e) {
            System.err.println("Error serving image for message: " + messageId);
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @CrossOrigin(
            origins = "https://beginning.gg/",
            allowCredentials = "true",
            methods = {RequestMethod.GET, RequestMethod.OPTIONS}
    )
    @GetMapping("/messages/{messageId}/recording")
    public ResponseEntity<ByteArrayResource> serveRecording(@PathVariable Long messageId) {
        try {
            byte[] fileBytes = userService.retrieveFile(messageId, "recording");

            MediaType contentType = MediaType.parseMediaType("audio/mpeg");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(contentType);
            headers.setCacheControl("public, max-age=3600");
            headers.setContentLength(fileBytes.length);
            headers.set("Accept-Ranges", "bytes");
            headers.set("Access-Control-Allow-Origin", "https://api.beginning.gg/");

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(new ByteArrayResource(fileBytes));

        } catch (Exception e) {
            System.err.println("Error serving recording for message: " + messageId);
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}