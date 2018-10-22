<?php 
// Log the visit.
require_once($_SERVER['DOCUMENT_ROOT'] . "/visitor/log_visitor.php");
$title = "Quick Assessment for Diet Formulation";
log_visitor($title);
?>

<!DOCTYPE html>

<html lang="en">
<head>

    <title>Quick Assessment for Diet Formulation</title>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Stylesheets -->
    <link rel="stylesheet" type="text/css" media="screen" href="css/bootstrap.min.css"/>
    <link rel="stylesheet" type="text/css" media="screen"
          href="/css/ui-lightness/jquery-ui-1.10.4.custom.min.css"/>
    <link rel="stylesheet" type="text/css" media="screen" href="/css/ui.jqgrid.css"/>
    <link rel="stylesheet" type="text/css" media="screen" href="css/datepicker.css"/>
    <link rel="stylesheet" type="text/css" media="screen" href="css/style.css"/>

    <!-- JavaScript -->
    <script src="/js/jquery-1.9.1.min.js" type="text/javascript"></script>
    <script src="/js/i18n/grid.locale-en.js" type="text/javascript"></script>
    <script src="/js/jquery.jqGrid.min.js" type="text/javascript"></script>
    <script src="/js/sylvester.js" type="text/javascript"></script>
    <script src="/js/jquery.form.js" type="text/javascript"></script>
    <script src="js/bootstrap.min.js" type="text/javascript"></script>
    <script src="js/bootstrap-multiselect.js" type="text/javascript"></script>
    <script src="/js/jquery-ui-1.10.4.custom.min.js" type="text/javascript"></script>
    <script src="js/bootstrap-datepicker.js" type="text/javascript"></script>
    <script src="js/jquery.blockUI.js" type="text/javascript"></script>
    <script src="js/feedval.js?v=1.2" type="text/javascript"></script>
    <script src="js/feedval_calc.js?v=1.2" type="text/javascript"></script>

    <script type="text/javascript">
function refreshfun() {
     window.location.href = "http://dairymgt.info/oldtools/DietFormulation/index.php?tab=tool";
}
    </script>
<?php 
if (isset($_GET['tab'])) {
    $tab = $_GET['tab'];
?>
    <script type="text/javascript">
    jQuery(document).ready(function(e) {
        $('.nav-tabs a[href="#tool"]').tab('show');
        
        $('.nav-tabs a[href="#evaluator"]').click(function(){
            alert( "Handler for .click() called." );
        });
//        
//        $( "#tabeval" ).click(function(){
//            alert( "Handler for .click() called." );
////            initCalc();
//        });
        
        
        console.log("It worked");
        return false;
    });
    </script>
<?php   
}
 ?>
<script type="text/javascript">
jQuery(document).ready(function(e){
    $('.nav-tabs a[href="#evaluator"]').off().click(function(){
        initCalc();
//	$('.footer-nav a[href="#evaluator"]').parent().addClass('active');
//	$('.footer-nav a[href="#tool"]').parent().removeClass('active');
//	$('.footer-nav a[href="#overview"]').parent().removeClass('active');
    });
    $('.footer-nav a[href="#evaluator"]').off().click(function(){
        initCalc();
//	$('.nav-tabs a[href="#evaluator"]').parent().addClass('active');
//	$('.nav-tabs a[href="#tool"]').parent().removeClass('active');
//	$('.nav-tabs a[href="#overview"]').parent().removeClass('active');
    });
    $('.nav-tabs a[href="#tool"]').off().click(function(){
//	$('.footer-nav a[href="#tool"]').parent().addClass('active');
//	$('.footer-nav a[href="#evaluator"]').parent().removeClass('active');
//	$('.footer-nav a[href="#overview"]').parent().removeClass('active');
    });
    $('.footer-nav a[href="#tool"]').off().click(function(){
//	$('.nav-tabs a[href="#tool"]').parent().addClass('active');
//	$('.nav-tabs a[href="#evaluator"]').parent().removeClass('active');
//	$('.nav-tabs a[href="#overview"]').parent().removeClass('active');
    });
    $('.nav-tabs a[href="#overview"]').off().click(function(){
//	$('.footer-nav a[href="#overview"]').parent().addClass('active');
//	$('.footer-nav a[href="#tool"]').parent().removeClass('active');
//	$('.footer-nav a[href="#evaluator"]').parent().removeClass('active');
    });
});
</script>
</head>

<body>

<div class="container">

    <div>
        <h3 class="text-center">Quick Assessment for Diet Formulation</h3>
        <h4 class="text-center">V. E. Cabrera and R. D. Shaver</h4>
    </div>

    <ul id="tabs" class="nav nav-tabs" data-tabs="tabs">
        <li class="active"><a href="#overview" data-toggle="tab">Overview</a></li>
        <li><a href="#tool" data-toggle="tab">Optimizer</a></li>
        <li><a href="#evaluator" data-toggle="tab">Evaluator</a></li>
       <!-- <li><a href="#help" data-toggle="tab">Help</a></li> -->
    </ul>

    <div class="tab-content" style="padding:0">
        <div id="overview" class="tab-pane active" style="padding:26px">
            <?php
            include("overview.php");
            ?>
        </div>

        <div id="tool" class="tab-pane" style="padding:26px">
            <div class="row bottom-buffer">
                <fieldset class="col-sm-6">
                    <legend>Upload Data</legend>
                    <form id="upload_form" action="ajax.php" method="post"
                          enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="download-template">
                                Template Spreadsheet:
                            </label><br>
                            <button class="btn btn-default download" id="download-template"
                                    type="button"
                                    title="Download this spreadsheet, enter your data and upload it back to perform an analysis.">
                                Download
                            </button>
                        </div>
                        <div class="form-group">
                            <label for="data_file">
                                Upload data as Excel file:
                            </label>
                            <input type="file" name="data_file" id="data_file"
                                   title="Download the template spreadsheet from above, enter your data and upload it back to perform an analysis."/>
                        </div>
                        <button id="data_file_submit" name="data_file_submit" type="submit"
                                class="btn btn-default" title="Upload selected file">
                            Upload
                        </button>
                    </form>
                </fieldset>
                <fieldset class="col-sm-6">
                    <legend>Select Nutrients and Date</legend>
                    <form>
                        <div class="form-group">
                            <label for="nutrients">
                                Select nutrients:
                            </label><br>
                            <select multiple="multiple" title="Select from available nutrients"
                                    id="nutrients" class="form-control">
                            </select>
                        </div>
                        <div class="form-group">
                            <label id="price_date" for="dateP">
                                Price date:
                            </label>

                            <div class="input-group date">
                                <input type="text" id="dateP" class="form-control"
                                       title="Select the date for ingredient prices" readonly/>
                            <span class="input-group-addon">
                                <i class="glyphicon glyphicon-calendar"></i>
                            </span>
                            </div>
                        </div>
                    </form>
                </fieldset>
            </div>

            <div class="row bottom-buffer">
                <fieldset class="col-sm-12">
                    <legend>Perform Analysis</legend>
                    <div class="btn-group">
                        
		        <button id="analyze" name="analyze" type="button" class="btn btn-default"
                                title="Perform analysis">
                            Least Cost Optimization
                        </button>
                        <button class="download btn btn-default" name="download" type="button"
                                title="Download results as Excel spreadsheet">
                            Download Results
                        </button>
                    </div>
                    <div class="btn-group">
                        <button id="convert-to-kgs" name="convert-to-kgs" type="button"
                                class="btn btn-default"
                                title="Convert the units of all ingredients to KG">
                            Convert all to kg
                        </button>
                     <div class="btn-group">
                        <button onclick="refreshfun()" class="btn btn-default">Refresh</button>
                    </div>
                    </div>
                    <br/>
                    <br/>
<!--                    <div class="checkbox">
                        <label for="remove_negative_price_nutrients">
                            <input name="remove_negative_price_nutrients"
                                   id="remove_negative_price_nutrients" type="checkbox"
                                   title="Check this box to automatically remove nutrients with negative predicted costs from the analysis."/>
                            Remove nutrients with negative predicted unit costs.
                        </label>
                    </div>-->
                    <table id="grid">
                        <tr>
                        </tr>
                    </table>
                    <!-- #grid -->

	        <div class="btn-group">
                        <button id="analyze-footer" name="analyze-footer" type="button" class="btn btn-default"
                                title="Perform analysis">
                            Least Cost Optimization
                        </button>
                        
			 <!--
  			<button class="download btn btn-default" name="download" type="button"
                                title="Download results as Excel spreadsheet">
                            Download Results
                        </button>
			-->
                </div>


                </fieldset>
            </div>
     <ul id="tabs-footer" class="nav nav-tabs footer-nav" data-tabs="tabs">
        <li class="active"><a href="#overview" data-toggle="tab">Overview</a></li>
        <li><a href="#tool" data-toggle="tab">Optimizer</a></li>
        <li><a href="#evaluator" data-toggle="tab">Evaluator</a></li>
       <!-- <li><a href="#help" data-toggle="tab">Help</a></li> -->
    </ul>
	           <div class="row bottom-buffer">
                <fieldset class="col-sm-12">
                    <legend>Calculation after Minimization:</legend>
                    <table id="prediction-accuracy">
                        <tr>
                            <td>
                                <b>Equation Result: </b>
                            </td>
                            <td>
                                <span id="eq_result"></span><br/>
                            </td>
                        <!--
			<tr>
                            <td>
                                <b>Adjusted R<sup>2</sup> :</b>
                            </td>
                            <td>
                                <span id="adjusted_r_square"></span><br/>
                            </td>
                        </tr>

			-->
                    </table>
                </fieldset>
            </div>
	    

            <div class="row">
                <div class="col-sm-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h4>Credits</h4>
                        </div>
                        <div class="panel-body">
                            <p>
                                * General midwest prices for ingredients are obtained from the
                                following
                                sources:
                            </p>
                            <ol>
                                <li>
                                    <a href="http://future.aae.wisc.edu/tab/feed.html#93"
                                       target="_blank"
                                       title="Understanding Dairy Markets">Understanding Dairy
                                        Markets</a>
                                    (compiled by <b>Brian
                                        W. Gould</b>): All displayed prices except <i>Good Quality
                                        Hay</i>
                                    and <i>Poor Quality
                                        Hay</i>.
                                </li>
                                <li>
                                    <a href="http://fyi.uwex.edu/forage/h-m-r/"
                                       title="Weekly Hay Market Demand and Price Report for the Upper Midwest"
                                       target="_blank">Weekly
                                        Hay Market Demand and Price Report for the Upper Midwest</a>
                                    (compiled by <b>Ken
                                        Barnett</b>): Prices for <i>Good Quality Hay</i> and <i>Poor
                                        Quality
                                        Hay</i>.
                                </li>
                            </ol>

                            <p>
                                <b>NOTE:</b> Prices are fetched on a daily basis from the above
                                sources. If
                                prices aren't
                                updated at the source, the last available prices are displayed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div id="evaluator" class="tab-pane" style="padding:26px">
            
            
            <div class="row bottom-buffer">
                <fieldset class="col-sm-6">
                    <legend>Upload Data</legend>
                    <form id="upload_form_calculate" action="ajax.php" method="post"
                          enctype="multipart/form-data">
                        <input type="hidden" name="tip" id="tip" value="tip" />
                        <div class="form-group">
                            <label for="download-template">
                                Template Spreadsheet:
                            </label><br>
                            <button class="btn btn-default calculate-download" id="download-template"
                                    type="button"
                                    title="Download this spreadsheet, enter your data and upload it back to perform an analysis.">
                                Download
                            </button>
                        </div>
                        
                        <div class="form-group">
                            <label for="data_file">
                                Upload data as Excel file:
                            </label>
                            <input type="file" name="data_file_calc" id="data_file_calc"
                                   title="Download the template spreadsheet from above, enter your data and upload it back to perform an analysis."/>
                        </div>
                        <button id="data_file_submit" name="data_file_submit_calc" type="submit"
                                class="btn btn-default" title="Upload selected file">
                            Upload
                        </button>
                        
                    </form>
                </fieldset>
            </div>
            
            
            <div class="row bottom-buffer">
                <fieldset class="col-sm-12">
                    <legend>Perform Analysis</legend>
                    <div class="btn-group">
                        
		        <button id="calculate" name="calculate" type="button" class="btn btn-default"
                                title="Perform analysis">
                            Calculate
                        </button>
                        <button class="calculate-download btn btn-default" name="downloadcal" type="button"
                                title="Download results as Excel spreadsheet">
                            Download Results
                        </button>
                    </div>
                    <div class="btn-group">
                        <button id="convert-to-kgscalc" name="convert-to-kgscalc" type="button"
                                class="btn btn-default"
                                title="Convert the units of all ingredients to KG">
                            Convert all to kg
                        </button>
                     <div class="btn-group">
                        <button onclick="refreshfun()" class="btn btn-default">Refresh</button>
                    </div>
                    </div>
<br/><br/>
<!--                    <div class="checkbox">
                        <label for="remove_negative_price_nutrients">
                            <input name="remove_negative_price_nutrients"
                                   id="remove_negative_price_nutrients" type="checkbox"
                                   title="Check this box to automatically remove nutrients with negative predicted costs from the analysis."/>
                            Remove nutrients with negative predicted unit costs.
                        </label>
                    </div>-->
                    <table id="grideval">
                        <tr>
                        </tr>
                    </table>
                    <!-- #grid -->

	        <div class="btn-group">
                        <button id="calculate-footer" name="calculate-footer" type="button" class="btn btn-default"
                                title="Perform analysis">
                            Calculate
                        </button>
                </div>
    <ul id="tabs-footer" class="nav nav-tabs footer-nav" data-tabs="tabs">
        <li class="active"><a href="#overview" data-toggle="tab">Overview</a></li>
        <li><a href="#tool" data-toggle="tab">Optimizer</a></li>
        <li><a href="#evaluator" data-toggle="tab">Evaluator</a></li>
    </ul>
	

                </fieldset>
            </div>
            
            
        </div>

    </div>
 <!--   <ul id="tabs-footer" class="nav nav-tabs footer-nav" data-tabs="tabs">
        <li class="active"><a href="#overview" data-toggle="tab">Overview</a></li>
        <li><a href="#tool" data-toggle="tab">Optimizer</a></li>
        <li><a href="#evaluator" data-toggle="tab">Evaluator</a></li>
    </ul>-->
	   



</div>

<div id="invalid-selection-modal" class="modal fade" role="dialog" aria-labelledby="modalLabel1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"
                        aria-hidden="true">&times;</button>
                <h4 class="modal-title" id="modalLabel1">Please check your selection</h4>
            </div>
            <div class="modal-body">
                <ol>
                    <li id="rup_rdp_cp">
                        If <b>CP</b> is selected, neither <b>RUP</b> nor <b>RDP</b> can be
                        selected.
                    </li>
                    <li id="rup_rdp">
                        Selecting only <b>RUP</b> and <b>RDP</b> is invalid as they together
                        constitute
                        <b>CP</b>.
                        Please select one more nutrient.
                    </li>
                    <li id="nut_all_zeroes">
                        Nutrient(s) <b><span> </span></b> is/are not present in any of the selected
                        ingredients. Please make sure they have a non-zero composition for at least
                        one of
                        the selected ingredients.
                    </li>
		    <li id="NumIngBigNumNut">
		        The Number of Selected Ingredients has to be bigger or equal than the Number 
                        of Selected Nutrients.

		    </li>
                    <li id="SolNoConverge">
                        There is no feasible solution. Solution found is the closest to a feasible solution. Not all constraints are met. Select more ingredients of relax constraints to find a feasible solution.
                    </li>
                    <li id="SolNotOptimal">
                        No feasible solution. Pick more ingredients or relax constraints.
                    </li>
                </ol>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<div id="ajax-error-modal" class="modal fade" role="dialog" aria-labelledby="modalLabel2">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"
                        aria-hidden="true">&times;</button>
                <h4 class="modal-title" id="modalLabel2">AJAX Error</h4>
            </div>
            <div class="modal-body">
                <p>
                    <b>Response Text: </b>
                    <span id="response_text"> </span>
                </p>

                <p>
                    <b>Text Status: </b>
                    <span id="text_status"> </span>
                </p>

                <p>
                    <b>Error Thrown: </b>
                    <span id="error_thrown"> </span>
                </p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<div id="request-in-progress" class="panel panel-info" style="display: none">
    <div class="panel-heading">
        <h4 class="panel-title">Request in Progress</h4>
    </div>
    <div class="panel-body">
        Fetching data from server. Please wait ...
    </div>
</div>
<style>
    #header2{
        height: 42px!important;
    }
iframe {height:100%;width:100%}
</style>
</body>

</html>
