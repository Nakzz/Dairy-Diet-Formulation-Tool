<?php
/**
 * Minimization Calculations using lpsolve 
 */
class FeedValMinimization
{
    private $minimizationArray; 
    const YES = 'YES';
    const NO = 'NO';
    const NUM_POUNDS_IN_ONE_CWT = 100;
    const NUM_POUNDS_IN_ONE_TON = 2000;
    const NUM_POUNDS_IN_ONE_KG = 2.20462262185;
   

    public function __construct($columnsToAppear, $data)
    {
        //$this->objPHPExcel = new PHPExcel();
        //$this->createSpreadsheet($columnsToAppear, $data);
        $this->getCoefficients($columnsToAppear, $data);
    }

    public function getMinArray()
    {
	
	return $this->minimizationArray;

    } 
    public function debug_to_console( $data ) {
	$output = $data;
	if ( is_array( $output ) )
		$output = implode( ',', $output);

	echo "<script>console.log( 'Debug Objects: " . $output . "' ); </script>";
    }

    public function getCoefficients($columnsToAppear, $data)
    {	
	$f = array(); //--> price
        $nutrients = array(); // -->
        //$num_nutrients = count($columnsToAppear)-8;
	$cons_rhs_max_2 = array();
	$cons_lhs_min_2 = array();

        $non_selected_indexes = array();
	$selected_indexes = array(); 

        //Generation of prices vector (f) and constraints limits, and nutrients
        $index_array=0;
	foreach ($data as $dataRow) {

		//nutrients values include LHS and RHS limints for the minimization
		if (($dataRow['Selected'] === 'YES')||($dataRow['Ingredient'] == 'Max')||($dataRow['Ingredient'] == 'Min')){
			if($dataRow['Price_Unit']=='')
				$f[]=0;
			else	
				{
				$unit_row = $dataRow['Unit'];
			        	
				switch ($unit_row) {
	
				case 'lb':
					$calculation = $dataRow['Price_Unit'] * self::NUM_POUNDS_IN_ONE_KG;
					$f[]=$calculation;
					break;			

				case 'ton':
					$calculation = $dataRow['Price_Unit'] * self::NUM_POUNDS_IN_ONE_KG  / self::NUM_POUNDS_IN_ONE_TON;
					$f[]=$calculation;
					break;
				case 'cwt':
                                        $f[]=$dataRow['Price_Unit'] * self::NUM_POUNDS_IN_ONE_KG / self::NUM_POUNDS_IN_ONE_CWT;
                                	break;
				default:
					$f[]=$dataRow['Price_Unit'];
				}
					
				}
			/*$unit_r = $dataRow['Unit'];
			switch ($unit_r) {
	
				case 'lb':
					$cons_rhs_max_2[] = $dataRow['Max_kgcowd'] / self::NUM_POUNDS_IN_ONE_KG;
					break;			

				default:
					$cons_rhs_max_2[]=$dataRow['Max_kgcowd'];
				

			}*/ 
			$cons_rhs_max_2[]=$dataRow['Max_kgcowd'];
			$cons_lhs_min_2[]=$dataRow['Min_kgcowd'];
			$nutrientsRow = array_slice($dataRow, 3);
                        $nutrients[]= array_slice($nutrientsRow, 0, -5); //FIXME: Change to -5 when Last resulta column dissapear
			
			if (($dataRow['Ingredient'] != 'Max')&&($dataRow['Ingredient'] != 'Min'))
				$selected_indexes[] = $index_array;
			
		}else {
			$non_selected_indexes[]=$index_array;

		}


		if(($dataRow['Ingredient'] == 'Max')||($dataRow['Ingredient'] == 'Min'))
			$non_selected_indexes[]=$index_array;
		$index_array++;

        }

			$cons_rhs_max_2 = array_slice($cons_rhs_max_2,0,-2);
			$cons_lhs_min_2 = array_slice($cons_lhs_min_2,0,-2);
			$f = array_slice($f,0,-2);
                

	$this->minimizationArray=$this->nonlinealcalculate($f,$columnsToAppear,$nutrients,$cons_rhs_max_2,$cons_lhs_min_2,$selected_indexes,$non_selected_indexes);

    }

   private function nonlinealcalculate($f,$columnsToAppear,$nutrients,$cons_rhs_max_2,$cons_lhs_min_2,$selected_indexes,$non_selected_indexes)
   {
	$DM = array();
        //Constraints
        $nutrientsArray = array();
        $columnsToAppear = array_slice($columnsToAppear,2,-5);

	foreach($nutrients as $nutrientRow){

                $DM[]=floatval($nutrientRow['DM']);
                $nutrientRowtmp = array();
		
		foreach($columnsToAppear as $column){
			$nutrientRowtmp[] = floatval($nutrientRow[$column]);
		}
                $nutrientsArray[]=$nutrientRowtmp;
        }

	$cons_lhs_min_1=$nutrientsArray[count($nutrientsArray)-2];
	$cons_rhs_max_1=$nutrientsArray[count($nutrientsArray)-1];
	$nutrientsArray = array_slice($nutrientsArray,0,-2);

	$DM = array_slice($DM,0,-2);

    // $command=  escapeshellarg(json_encode($f)) . ' ' . escapeshellarg(json_encode($DM)) .' ' . escapeshellarg(json_encode($cons_rhs_max_2)) .' '. escapeshellarg(json_encode($cons_lhs_min_2)) . ' ' . escapeshellarg(json_encode($cons_rhs_max_1)) . ' '. escapeshellarg(json_encode($cons_lhs_min_1)) . ' ' . escapeshellarg(json_encode($nutrientsArray)). ' ' . escapeshellarg(json_encode($selected_indexes)) ;

    // echo $command;

	$results = shell_exec('python nonlineal/dietcal_example.py ' . escapeshellarg(json_encode($f)) . ' ' . escapeshellarg(json_encode($DM)) .' ' . escapeshellarg(json_encode($cons_rhs_max_2)) .' '. escapeshellarg(json_encode($cons_lhs_min_2)) . ' ' . escapeshellarg(json_encode($cons_rhs_max_1)) . ' '. escapeshellarg(json_encode($cons_lhs_min_1)) . ' ' . escapeshellarg(json_encode($nutrientsArray)). ' ' . escapeshellarg(json_encode($selected_indexes)));
    
    // echo $results;
    
    $resultData = json_decode($results, true);
    
    



	//Taking care of non selected results
	//maing solution of array of size #ingredients+MIN,MAX
        
        for($i=0;$i<count($resultData[0]);$i++){
                $index_tmp = $selected_indexes[$i];
                $minimizationArraySelected[$index_tmp] = $resultData[0][$i];
        }

        for($i=0;$i<count($non_selected_indexes);$i++){
                $index_tmp = $non_selected_indexes[$i];
                $minimizationArrayNonSelected[$index_tmp] = null; //FIXME: Change the value to Null or something else
        }

        if(empty($minimizationArraySelected)){
            $minimizationArraySelected = null;
        } 

        $minimizationArrayFull = $minimizationArraySelected + $minimizationArrayNonSelected;

        for($i=0;$i<count($minimizationArrayFull);$i++){

                $minimizationArrayFinal[]= $minimizationArrayFull[$i];
        }

        $resultData[0]=$minimizationArrayFinal;

	//print_r($resultData); //FIXME:Delete this when is fixed
	
        return $resultData;
        

   } 
}
