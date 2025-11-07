package beginningdotgg.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;

@Service
public class FileService {

    private static final String ENCRYPTION_ALGO = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int AES_KEY_SIZE = 128;

    private final SecretKey secretKey;

    public FileService() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_SIZE);
        this.secretKey = keyGen.generateKey();
    }

    public byte[] encryptFile(MultipartFile multipartFile) throws Exception {
        byte[] fileBytes = multipartFile.getBytes();

        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGO);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encryptedBytes = cipher.doFinal(fileBytes);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        outputStream.write(iv);
        outputStream.write(encryptedBytes);

        return outputStream.toByteArray();
    }

    public byte[] decryptFile(byte[] encryptedData) throws Exception {
        byte[] iv = new byte[12];
        System.arraycopy(encryptedData, 0, iv, 0, 12);

        byte[] encryptedContent = new byte[encryptedData.length - 12];
        System.arraycopy(encryptedData, 12, encryptedContent, 0, encryptedContent.length);

        Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGO);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        return cipher.doFinal(encryptedContent);
    }
}