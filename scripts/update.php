#!/usr/bin/php

<?php

$scriptDir = dirname(__FILE__);
if (!chdir($scriptDir)) {
    exit("Cannot change directory to $scriptDir");
}

require_once '../utils/FeedValUpdateAutoload.php';

$feedValDatabase = new FeedValDatabase();

try {
    $options = getOptions();

    if (isset($options['r']) && isset($options['u'])) {
        echoNl('Options -r and -u cannot be used simultaneously. Please specify only one of them.');
        exit;
    }

    if (isset($options['r'])) {
        if (isset($options['i']) && isset($options['d'])) {
            $ingredientIDs = explode(',', $options['i']);
            $dates = explode(':', $options['d']);
            if (count($dates) > 2) {
                echoNl("ERROR: Invalid date range.");
                exit;
            }
            foreach ($ingredientIDs as $ingredientID) {
                $startDate = new DateTime($dates[0]);
                $endDate = isset($dates[1]) ? new DateTime($dates[1]) : new DateTime($dates[0]);
                for ($date = $startDate; $date <= $endDate; $date->add(new DateInterval('P1D'))) {
                    $dateString = $date->format('Y-m-d');
                    echoNl("Resetting price for ingredient $ingredientID for date $dateString.");
                    $feedValDatabase->resetPricesForIngredientForDate($ingredientID, $dateString);
                }
            }
        } else if (isset($options['i'])) {
            $ingredientIDs = explode(',', $options['i']);
            foreach ($ingredientIDs as $ingredientID) {
                echoNl("Resetting price for ingredient $ingredientID for all dates.");
                $feedValDatabase->resetPricesForIngredient($ingredientID);
            }
        } else if (isset($options['d'])) {
            $dates = explode(':', $options['d']);
            if (count($dates) > 2) {
                echoNl("ERROR: Invalid date range.");
                exit;
            }
            $startDate = new DateTime($dates[0]);
            $endDate = isset($dates[1]) ? new DateTime($dates[1]) : new DateTime($dates[0]);
            for ($date = $startDate; $date <= $endDate; $date->add(new DateInterval('P1D'))) {
                $dateString = $date->format('Y-m-d');
                echoNl("Resetting price for all ingredients for date $dateString.");
                $feedValDatabase->resetPricesForDate($dateString);
            }
        } else {
            echo "";
            echoNl("This will reset ALL the prices of ALL the ingredients for ALL the dates. Meaning, all the prices for all the ingredients will be deleted and a refetch will be attempted. Note that historical prices for some ingredients like Poor Quality Hay and Good Quality Hay are not available and so will not be recovered.");
            echo "Do you want to continue (y/N): ";
            $line = trim(fgets(STDIN));
            if (strcasecmp($line, 'Y') != 0) {
                echoNl("Not resetting prices.");
                exit;
            }
            echoNl("Resetting price for all ingredients for all dates.");
            $feedValDatabase->resetPrices();
        }

    } else if (isset($options['u'])) {
        echoNl("Fetching and updating today's price for all ingredients");
        $feedValDatabase->recordTodaysPrices();
    }

} catch (Console_GetoptPlus_Exception $e) {
    $error = array($e->getCode(), $e->getMessage());
    print_r($error);
}

function getOptions()
{
    $config = array(
        'header' => array(
            'A command line interface to update prices of ingredients.',
            '',
            'Available actions:',
            '1. Reset prices of ingredients: prices of the specified ingredients will be',
            '   deleted and an attempt will be made to refetch the prices from the date they',
            '   first became available. See the note in -r for the type of ingredients for which',
            '           an attempt will be made to refetch the prices once they are deleted. A list of',
            '   ingredients can be specified with -i',
            '2. Update prices: Fetch today\'s prices for all ingredients. This is the option used',
            '   by the cron job.',
            '3. Delete prices of ingredients: delete all the prices of all the ingredients. No',
            '   attempt will be made to refetch the prices.',
            ''),
        'usage' => array(
            '-r [-i <ingredient_id>[,<ingredient_id>,<ingredient_id>...]] [-d <start_date>[:<end_date>]]',
            '-u'),
        'options' => array(
            array('short' => 'r', 'long' => 'reset', 'type' => 'noarg',
                'desc' => array('Delete all the prices of all ingredients in the PRICES table',
                    'and try to refetch them. If an ingredient ID is specified with -i, only',
                    'prices for that ingredient are deleted and refetched. If no ingredient',
                    'is specified, this operation is performed for all the ingredients. If a',
                    'date is specified, this operation will be performed only for that date,',
                    'else, it will be performed for all the dates from the start date.',
                    '',
                    'NOTE: Once deleted, this option will try to restore prices of only those',
                    'ingredients for which historical prices are available. For those ingredients',
                    'for which historical prices are not available, the script will delete the',
                    'prices but will not refetch them. For such ingredients, only the current',
                    'date\'s price will be updated.')),
            array('short' => 'u', 'long' => 'update', 'type' => 'noarg',
                'desc' => array('Fetch and update today\'s price for all ingredients.')),
            array('short' => 'i', 'type' => 'mandatory',
                'desc' => array('ingredient_id[,ingredient_id,ingredient_id,...]',
                    'The ingredient ID for which the operation should be performed. A list of',
                    'IDs can be specified by separating them with commas (no spaces). Example: ',
                    '-i 10,1,20')),
            array('short' => 'd', 'type' => 'mandatory',
                'desc' => array('date[:date]',
                    'The date, in format YYYY-MM-DD, for which the operation should be performed.',
                    'A date range can be specified by separating the start date and the end date',
                    'with a colon (no spaces). This argument should be specified in quotes, for',
                    'example -d \'2013-10-01:2019-12-04\'')),
            array('short' => 'h', 'type' => 'optional', 'long' => 'help',
                'desc' => array('This help.'))));
    $options = Console_Getoptplus::getoptplus($config, '', true);
    return $options[0];
}

function echoNl($str)
{
    echo $str . "\n";
}

?>
