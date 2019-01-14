<?php

class FeedValUtil {

    /**
     * Creates a temporary with the supplied extension.
     *
     * @param string $ext The extension without the period (.).
     *
     * @return string The temporary file with the extension.
     */
    public static function createTemporaryFileWithExtension($ext) {
        $TMP_DIR = $_SERVER['DOCUMENT_ROOT'] . '/tmp/';
        $fileName = '';
        $created = FALSE;

        while (!$created) {
            // Create a temporary file without an extension.
            $tmpFile = tempnam($TMP_DIR, 'dietformulation_');

            // Append the extension to the temporary file and save it.
            $fileName = $tmpFile . '.' . $ext;
            $created = touch($fileName);

            // Delete the temporary file without extension.
            unlink($tmpFile);
        }
        return $fileName;
    }

    /**
     * Uploads the user submitted file to a temporary directory and returns
     * the saved file's path.
     * @param string $file The file to upload.
     *
     * @return string The path to the user-uploaded file.
     */
    public static function uploadFile($file) {
        // Get the extension of the user uploaded file.
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);

        // Create a temporary file with this extension.
        $fileName = self::createTemporaryFileWithExtension($ext);
        if (!move_uploaded_file($file['tmp_name'], $fileName)) {
            exit("Could not move uploaded file (" . $file['tmp_name'] . ") to $fileName");
        }

        return $fileName;
    }

}
