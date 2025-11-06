package beginningdotgg.service.dto;

import beginningdotgg.model.UserMessage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserMessageDTO {
    private Long id;
    private String text;
    private DiscordUserDTO user;
    private boolean hasImage;
    private boolean hasRecording;
    private String imageFilename;
    private String recordingFilename;

    public static UserMessageDTO toDTO(UserMessage message) {
        return new UserMessageDTO(
                message.getId(),
                message.getText(),
                new DiscordUserDTO(message.getUser().getId(), message.getUser().getLoginName()),
                message.getImageData() != null,
                message.getRecordingData() != null,
                message.getImageFilename(),
                message.getRecordingFilename()
        );
    }
}