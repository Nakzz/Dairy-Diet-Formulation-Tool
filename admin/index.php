<?php
    $valid_formats = array("pdf", "xlsm", "xlsb", "xls");
    $max_file_size = 2097152; //100 kb 1024*100
    $path = "../monthly_analysis/"; // Upload directory
    $count = 0;
    $error = 0;
    if(isset($_POST) and $_SERVER['REQUEST_METHOD'] == "POST")
    {
        // Loop $_FILES to exeicute all files
        foreach ($_FILES['files']['name'] as $f => $name) 
        {     
            if ($_FILES['files']['error'][$f] == 4) 
            {
                continue; // Skip file if any error found
            }          
            if ($_FILES['files']['error'][$f] == 0) 
            {              
                if ($_FILES['files']['size'][$f] > $max_file_size) 
                {
                    $message[] = "$name is too large!.";
                    $error = 1;
                    continue; // Skip large files
                }
                elseif( ! in_array(pathinfo($name, PATHINFO_EXTENSION), $valid_formats) )
                {
                    $error = 1;
                    $message[] = "$name is not a valid format";
                    continue; // Skip invalid file formats
                }
                else
                { // No error found! Move uploaded files 
                    if(move_uploaded_file($_FILES["files"]["tmp_name"][$f], $path.$name))
                    {
                        $count++; // Number of successfully uploaded file
                    }
                }
            }
        }
        if($count > 0)
        {
            $message[] = "File Uploaded Successfully";
        }
    }
?>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>File Ppload </title>
  <link rel="stylesheet" type="text/css" href="css/custom.css">
</head>
<body>
  <form action="" method="post" enctype="multipart/form-data">
    <div class="container">
        <div class="head_main">
            <h1>Upload Your File</h1>
        </div>
        <div class="clr"></div>
        <div class="inner">
            <input type="file" id="file" name="files[]" multiple="multiple"  />
        </div>
        <div class="clr"></div>
        <div class="inner">
            <input type="submit" value="Upload!" class="upload" /><br />
            <span>Please Upload PDF And Spreadsheet File Only..</span>
        </div>
        <div class="clr"></div>
        <?php
        if(!empty($message))
        {
            foreach ($message as $value) 
            {
                if($error > 0)
                {
        ?>
        <div>
            <div class="alert_msg"><?php echo $value; ?></div>
        </div>
        <?php
                }
                else
                {
        ?>
        <div>
            <div class="success_msg"><?php echo $value; ?></div>
        </div>
        <?php
                }
            }
        }
    ?>
        <div class="clr"></div>
    </div>
</form>
</body>
</html>