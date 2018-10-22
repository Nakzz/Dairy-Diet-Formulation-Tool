<?php

class DatePriceUnit
{
    private $date;
    private $price;
    private $unit;

    /**
     * Constructs a new DatePriceUnit object.
     * @param string $date the date in the format YYYY-MM-DD
     * @param number $price the price.
     * @param string $unit the unit.
     */
    function __construct($date, $price, $unit = '')
    {
        $this->date = $date;
        $this->price = $price;
        $this->unit = $unit;
    }

    public function getDate()
    {
        return $this->date;
    }

    public function getPrice()
    {
        return $this->price;
    }

    public function getUnit()
    {
        return $this->unit;
    }
}

?>