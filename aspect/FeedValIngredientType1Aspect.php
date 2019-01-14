<?php

class FeedValIngredientType1Aspect extends FeedValAspect {

    public function aroundGetFileContents(AopJoinPoint $jpt)
    {
        try {
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function createAdvices()
    {
        aop_add_around('FeedValIngredientType1->getFileContents()', array($this,
            'aroundGetFileContents'));
    }
}