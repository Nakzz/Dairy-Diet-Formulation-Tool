<?php
// This is the data you want to pass to Python
$data = array(10, 5, 5);

// Execute the python script with the JSON data
$result = shell_exec('python /var/www/dairymgt-site/oldtools/DietFormulation/factory/data_from_php.py ' . escapeshellarg(json_encode($data)));

// Decode the result
//$resultData = json_decode($result, true);

// This will contain: array('status' => 'Yes!')
//var_dump($resultData);
?>
