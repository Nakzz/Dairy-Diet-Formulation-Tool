<?php

include("lp_maker.php");
$num_ingredients = 40;
$num_nutrients = 16;
include('example_data.php');

$b=array();

for($i=0;$i<count($CONS_RHS_MAX_1);$i++){
	$b[$i]=$CONS_RHS_MAX_1[$i];
}

for($i=0;$i<count($CONS_RHS_MAX_2);$i++){
        $b[]=$CONS_RHS_MAX_2[$i];
}

for($i=0;$i<count($CONS_RHS_MIN_1);$i++){
        $b[]=$CONS_RHS_MIN_1[$i];
}


#[2] Inequality opertor

$ineq =array();

#Associatd to Sol Constrainst less or equal to
for($i=0;$i<$num_ingredients;$i++){
$ineq[]= -1;
}

#Associated to Nutrients Constraints

//Less than constraints
for($j=0;$j<$num_nutrients;$j++){
$ineq[]=-1;
}

//Greater than constraints
for($j=0;$j<$num_nutrients;$j++){

$ineq[]= 1;

}

$f = $price;
$A = array();
$a_int = array();

for($j=0;$j<$num_ingredients;$j++){
	for($i=0;$i<$num_ingredients;$i++){
		       if ($i==$j)
				$a_int[]=1;		
		       else
				$a_int[]=0;
	
	    }
	$A[] = $a_int;
	$a_int = array();
}

//Constraints
$a_int = array();
for($j=0;$j<$num_nutrients;$j++){
  	for($i=0;$i<$num_ingredients;$i++){
		if ($j==0)
			$a_int[$i]=$NUTRIENTS[$j][$i]/100;
		elseif ($j==1) 
			$a_int[$i]=$NUTRIENTS[$j][$i]*$DM[$i]/100;
		else
			$a_int[$i]=$NUTRIENTS[$j][$i]*$DM[$i]/10000;
  		}

	$A[] = $a_int;
        $a_int = array();
}


$a_int = array();
for($j=0;$j<$num_nutrients;$j++){
        for($i=0;$i<$num_ingredients;$i++){
                if ($j==0)
                        $a_int[$i]=$NUTRIENTS[$j][$i]/100;
                elseif ($j==1)
                        $a_int[$i]=$NUTRIENTS[$j][$i]*$DM[$i]/100;
                else
                        $a_int[$i]=$NUTRIENTS[$j][$i]*$DM[$i]/10000;
                }

        $A[] = $a_int;
        $a_int = array();
}

$lp = lp_maker($f, $A, $b, $ineq, null, null, null, 1, 0);
$solvestat = lpsolve('solve', $lp);
$obj = lpsolve('get_objective', $lp);
print $obj . "\n";
$x = lpsolve('get_variables', $lp);
print_r($x);
lpsolve('delete_lp', $lp);

?>
