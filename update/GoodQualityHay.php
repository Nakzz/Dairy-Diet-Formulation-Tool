<?php

class GoodQualityHay extends FeedValIngredientType2 {

    // The row and column numbers correspond to the average price of a large square in
    // the price table.
    const PRICE_TABLE_ROW_NUM = 3;
    const PRICE_TABLE_COL_NUM = 2;

    /**
     * Gets the cell in the price table that contains the price for this ingredient.
     */
    protected function getPriceCell()
    {
        return new PriceCell(self::PRICE_TABLE_ROW_NUM, self::PRICE_TABLE_COL_NUM);
    }
}
