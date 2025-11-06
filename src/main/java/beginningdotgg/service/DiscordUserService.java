package beginningdotgg.service;

import beginningdotgg.model.DiscordUser;
import beginningdotgg.model.UserMessage;
import beginningdotgg.persistence.DiscordUserRepository;
import beginningdotgg.persistence.UserMessageRepository;
import beginningdotgg.service.dto.DiscordUserDTO;
import beginningdotgg.service.dto.UserMessageDTO;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiscordUserService {

    private final DiscordUserRepository userRepository;
    private final UserMessageRepository userMessageRepository;
    private final FileService fileService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final String UNIVERSAL_PASSWORD = "HappyBirthdayRei1109";

    public DiscordUserService(
            DiscordUserRepository userRepository,
            UserMessageRepository userMessageRepository,
            FileService fileService
    ) {
        this.userRepository = userRepository;
        this.userMessageRepository = userMessageRepository;
        this.fileService = fileService;
    }

    @Transactional
    public DiscordUserDTO loginOrCreateUser(String loginName, String password) {
        if (!UNIVERSAL_PASSWORD.equals(password)) {
            throw new RuntimeException("Invalid password");
        }

        DiscordUser user = userRepository.findByLoginName(loginName)
                .orElseGet(() -> {
                    DiscordUser newUser = new DiscordUser();
                    newUser.setLoginName(loginName);
                    newUser.setPassword(passwordEncoder.encode(UNIVERSAL_PASSWORD));
                    return userRepository.save(newUser);
                });

        return new DiscordUserDTO(user.getId(), user.getLoginName());
    }

    @Transactional
    public UserMessageDTO createMessage(Long userId, String text, MultipartFile recording, MultipartFile image) throws Exception {
        DiscordUser user = getUserById(userId);

        UserMessage message = new UserMessage();
        message.setUser(user);
        message.setText(text);

        if (recording != null && !recording.isEmpty()) {
            byte[] encryptedRecording = fileService.encryptFile(recording);
            message.setRecordingData(encryptedRecording);
            message.setRecordingFilename(recording.getOriginalFilename());
            System.out.println("✅ Encrypted and stored recording: " + recording.getOriginalFilename());
        }

        if (image != null && !image.isEmpty()) {
            byte[] encryptedImage = fileService.encryptFile(image);
            message.setImageData(encryptedImage);
            message.setImageFilename(image.getOriginalFilename());
            System.out.println("✅ Encrypted and stored image: " + image.getOriginalFilename());
        }

        userMessageRepository.save(message);
        return UserMessageDTO.toDTO(message);
    }

    @Transactional
    public UserMessageDTO modifyMessage(Long userId, Long messageId, String newText) {
        UserMessage message = getMessageByIdAndCheckOwner(userId, messageId);
        message.setText(newText);
        userMessageRepository.save(message);
        return UserMessageDTO.toDTO(message);
    }

    @Transactional
    public UserMessageDTO replaceMessageFile(Long userId, Long messageId, MultipartFile newRecording, MultipartFile newImage) throws Exception {
        UserMessage message = getMessageByIdAndCheckOwner(userId, messageId);

        if (newRecording != null && !newRecording.isEmpty()) {
            byte[] encryptedRecording = fileService.encryptFile(newRecording);
            message.setRecordingData(encryptedRecording);
            message.setRecordingFilename(newRecording.getOriginalFilename());
            System.out.println("✅ Replaced recording: " + newRecording.getOriginalFilename());
        }

        if (newImage != null && !newImage.isEmpty()) {
            byte[] encryptedImage = fileService.encryptFile(newImage);
            message.setImageData(encryptedImage);
            message.setImageFilename(newImage.getOriginalFilename());
            System.out.println("✅ Replaced image: " + newImage.getOriginalFilename());
        }

        userMessageRepository.save(message);
        return UserMessageDTO.toDTO(message);
    }

    @Transactional
    public List<UserMessageDTO> getAllMessages() {
        return userMessageRepository.findAll()
                .stream()
                .map(UserMessageDTO::toDTO)
                .collect(Collectors.toList());
    }

    public List<UserMessageDTO> getUserMessages(Long userId) {
        DiscordUser user = getUserById(userId);
        return userMessageRepository.findByUser(user)
                .stream()
                .map(UserMessageDTO::toDTO)
                .collect(Collectors.toList());
    }

    public byte[] retrieveFile(Long messageId, String fileType) throws Exception {
        UserMessage message = userMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found with ID: " + messageId));

        byte[] encryptedData = null;

        if ("image".equals(fileType)) {
            encryptedData = message.getImageData();
            if (encryptedData == null) {
                throw new RuntimeException("No image found for message ID: " + messageId);
            }
        } else if ("recording".equals(fileType)) {
            encryptedData = message.getRecordingData();
            if (encryptedData == null) {
                throw new RuntimeException("No recording found for message ID: " + messageId);
            }
        } else {
            throw new RuntimeException("Invalid file type: " + fileType + ". Must be 'image' or 'recording'");
        }

        System.out.println("🔓 Decrypting " + fileType + " for message ID: " + messageId);
        return fileService.decryptFile(encryptedData);
    }

    private DiscordUser getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }

    private UserMessage getMessageByIdAndCheckOwner(Long userId, Long messageId) {
        DiscordUser user = getUserById(userId);
        UserMessage message = userMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found with ID: " + messageId));

        if (!message.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied. You can only modify your own messages.");
        }

        return message;
    }
}