<?php

/**
 * NOTE: This ingredient's price is 10 * Shelled Corn price in bushels.
 * It is assumed that for any particular day, the Shelled Corn price is
 * updated before the Corn Silage price.
 */

class CornSilage extends FeedValIngredientType1
{
    const SHELLED_CORN = 'Shelled Corn';
    const PRICE_MULTIPLICATION_FACTOR = 10;

    public function __construct($db, $id, $name, $url, $city)
    {
        parent::__construct($db, $id, $name, $url, $city);
    }

    public function refetchPrices()
    {
        $this->deletePrices();

        $cornSilageUnit = $this->getRequiredUnit();
        $shelledCornPrices = $this->getShelledCornPrices();
        foreach ($shelledCornPrices as $shelledCornPrice) {
            $date = $shelledCornPrice->getDate();
            $scPrice = $shelledCornPrice->getPrice();
            $scUnit = $shelledCornPrice->getUnit();
            $scPriceInBu = UnitConverter::getPriceInUnit(self::SHELLED_CORN, $scPrice, $scUnit, 'bu');
            $cornSilagePrice = $scPriceInBu * self::PRICE_MULTIPLICATION_FACTOR;

            $this->insertPrice($date, $cornSilagePrice, $cornSilageUnit);
        }
    }

    public function refetchPriceForDate($date)
    {
        $shelledCornPriceForDate = $this->getShelledCornPrice($date);
        $cornSilagePriceForDate = $shelledCornPriceForDate * self::PRICE_MULTIPLICATION_FACTOR;
        $unit = $this->getRequiredUnit();
        $this->insertPrice($date, $cornSilagePriceForDate, $unit);
    }

    private function getRequiredUnit()
    {
        $query = 'SELECT UNIT FROM ' . FeedValDatabase::TBL_INGREDIENTS . ' WHERE INGREDIENT_ID = ' . $this->id;
        $rows = $this->db->query($query);
        $row = $rows->fetch(PDO::FETCH_ASSOC);

        return $row['UNIT'];
    }

    public function recordTodaysPrice()
    {
        $date = date('Y-m-d');
        $shelledCornPrice = $this->getShelledCornPrice($date);
        $cornSilagePrice = $shelledCornPrice * self::PRICE_MULTIPLICATION_FACTOR;
        $unit = $this->getRequiredUnit();
        $this->insertTodaysPrice($cornSilagePrice, $unit);
    }

    private function getShelledCornPrice($date)
    {
        $shelledCornId = $this->getShelledCornId();
        $query = 'SELECT PRICE FROM ' . FeedValDatabase::TBL_PRICES . " WHERE INGREDIENT_ID = $shelledCornId  AND DATE = '$date'";
        $rows = $this->db->query($query);
        $row = $rows->fetch(PDO::FETCH_ASSOC);

        return $row['PRICE'];
    }

    private function getShelledCornPrices()
    {
        $shelledCornId = $this->getShelledCornId();
        $query = 'SELECT DATE, PRICE, UNIT FROM ' . FeedValDatabase::TBL_PRICES . ' WHERE INGREDIENT_ID = ' . $shelledCornId;

        $prices = array();
        foreach ($this->db->query($query, PDO::FETCH_ASSOC) as $row) {
            $date = $row['DATE'];
            $price = $row['PRICE'];
            $unit = $row['UNIT'];

            $prices[] = new DatePriceUnit($date, $price, $unit);
        }

        return $prices;
    }

    private function getShelledCornId()
    {
        $query = 'SELECT INGREDIENT_ID FROM ' . FeedValDatabase::TBL_INGREDIENTS . ' WHERE INGREDIENT = "' . self::SHELLED_CORN . '"';
        $rows = $this->db->query($query);
        $row = $rows->fetch(PDO::FETCH_ASSOC);

        return $row['INGREDIENT_ID'];
    }

}

?>
