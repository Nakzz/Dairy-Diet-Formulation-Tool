#!/usr/bin/php

<?php

$scriptDir = dirname(__FILE__);
if (!chdir($scriptDir)) {
    exit("Cannot change directory to $scriptDir");
}

include '../factory/DatabaseConnectionFactory.php';

if ($argc != 2) {
    exit('Usage: ' . basename(__FILE__) . ' id1[,id2,id3...]' . "\n");
}

$ingredientIDs = preg_split('/,\s*/', $argv[1]);

$missingDates = new MissingDates($ingredientIDs);
$missingDates->generateCSVWithMissingDates();

/**
 * Generates CSV files containing dates for which prices are missing for ingredients.
 */
class MissingDates
{

    /**
     * @var [PDO] the database access object.
     */
    private $db;

    private $ingredientIDs;

    const ONE_DAY_INTERVAL = 'P1D';
    const DATE_FORMAT = 'Y-m-d';

    public function __construct($ingredientIDs)
    {
        $this->ingredientIDs = $ingredientIDs;
        $this->db = FeedValDatabaseConnectionFactory::getConnection();
    }

    private function getMinDate($ingredientID)
    {
        $query = "SELECT MIN(DATE) FROM prices WHERE INGREDIENT_ID = $ingredientID";
        $stmt = $this->db->query($query);
        $minDates = $stmt->fetchAll(PDO::FETCH_NUM);

        return new DateTime($minDates[0][0]);
    }

    private function getMaxDate()
    {
        return new DateTime('now');
    }

    public function generateCSVWithMissingDates()
    {
        foreach ($this->ingredientIDs as $ingredientID) {
            $missingDates = array();
            $minDate = $this->getMinDate($ingredientID);
            $maxDate = $this->getMaxDate();
            for ($date = $minDate; $date <= $maxDate; $date->add(new DateInterval(self::ONE_DAY_INTERVAL))) {
                echo "Checking date " . $date->format(self::DATE_FORMAT) . " for ID $ingredientID" . '...';
                if (!$this->priceExists($ingredientID, $date)) {
                    echo "missing";
                    $missingDates[] = array($ingredientID, $date->format(self::DATE_FORMAT));
                } else {
                    echo "present";
                }
                echo "\n";
            }
            if (count($missingDates)) {
                $this->writeCSV($ingredientID, $missingDates);
            }
        }
    }

    /**
     * Checks if prices for an ingredient exists for a specific date.
     * @param $ingredientID integer the ingredient ID.
     * @param $date DateTime the date.
     *
     * @return true if the prices exists, false otherwise.
     */
    private function priceExists($ingredientID, $date)
    {
        $dateString = $date->format(self::DATE_FORMAT);
        $query = "SELECT COUNT(*) FROM prices WHERE INGREDIENT_ID = $ingredientID and DATE = '" . $dateString . "'";
        $stmt = $this->db->query($query);
        $rows = $stmt->fetchAll();

        return $rows[0][0];
    }

    private function writeCSV($ingredientID, $missingDates)
    {
        $filename = $ingredientID . '_missing_dates.csv';
        $handle = fopen($filename, 'w');
        fputcsv($handle, array('INGREDIENT_ID', 'DATE'), ',');
        foreach ($missingDates as $missingDate) {
            fputcsv($handle, $missingDate);
        }
        fclose($handle);
    }
}

