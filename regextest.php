<?php
const MAX_REGEX = '/^(?:max\s*kg|cow\s*d)/i';

echo (preg_match(MAX_REGEX,'Max kg/cow.d'));


?>
