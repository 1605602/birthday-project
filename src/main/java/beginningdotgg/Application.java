package beginningdotgg;

import beginningdotgg.service.DiscordUserService;
import beginningdotgg.service.dto.DiscordUserDTO;
import beginningdotgg.service.dto.UserMessageDTO;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner commandLineRunner(DiscordUserService userService) {
        return args -> {
            try {
                final String TEST_USERNAME = "Sam";
                final String TEST_PASSWORD = "HappyBirthdayRei1109";

                DiscordUserDTO user = userService.loginOrCreateUser(TEST_USERNAME, TEST_PASSWORD);
                System.out.println("Logged in or created user: " + user);

                UserMessageDTO message = userService.createMessage(
                        user.getId(),
                        "Happy birthday! You bring life and joy to all of us, may you have the best birthday and may your day be filled with everything you wish for! You are an amazing person worthy of all the praise and love, you're the greatest!",
                        null,
                        null
                );
//                System.out.println("Created unique message: " + message);

//                UserMessageDTO updatedMessage = userService.modifyMessage(
//                        user.getId(),
//                        message.getId(),
//                        "Updated message text via CommandLineRunner (" + java.time.LocalTime.now() + ")"
//                );
//                System.out.println("Updated message: " + updatedMessage);

            } catch (Exception e) {
                e.printStackTrace();
            }
        };
    }
}