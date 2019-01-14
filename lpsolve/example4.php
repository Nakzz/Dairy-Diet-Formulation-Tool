<?php

include("lp_maker.php");

$f = Array(143, 60);
$A = Array(Array(120, 210), Array(110, 30), Array(1, 1));
$b = Array(15000, 4000, 75);

/*
echo "f:";
print_r($f);
echo "--------------------------------------------------------------------- \n";

echo "A:";
print_r($A);
echo "--------------------------------------------------------------------- \n";


echo "b:";
print_r($b);
echo "--------------------------------------------------------------------- \n";

echo "e:";
print_r($ineq);
echo "--------------------------------------------------------------------- \n";
*/



$lp = lp_maker($f, $A, $b, Array(-1, -1, -1), null, null, null, 1, 0);
$solvestat = lpsolve('solve', $lp);
$obj = lpsolve('get_objective', $lp);
print $obj . "\n";
$x = lpsolve('get_variables', $lp);
print_r($x);
lpsolve('delete_lp', $lp);

?>
