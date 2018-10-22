<?php

class FeedValSpreadsheetFactory {

    public static function createSpreadsheet($columnsToAppear, $data)
    {
        return new FeedValSpreadsheet($columnsToAppear, $data);
    }
}