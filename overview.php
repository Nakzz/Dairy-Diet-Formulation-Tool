<section>
    <h3>Overview</h3>

    <p>

    This tool does not replace the full diet formulation software normally used by nutritionists. The motivation behind this tool is to provide a simple and quick assessment of the ingredients that will provide the least cost of a diet under current feed ingredient prices and selected nutrients. This tool complements diet formulation software.
</p>

<p>
This tool performs an optimization to find out a list and amount of feed ingredients (a diet) that will provide defined acceptable levels of selected nutrients at the least cost (NRC, 2001).
</p>

<p>
Calculations are standard optimization algorithms with the objective function of minimizing the aggregated cost of the ingredients under the restrictions of providing a concentration of nutrients within a range (a value between a defined minimum and maximum). Since concentration of nutrients depends on the amount of feeds and their dry matter content, which results in feedback between ingredients tested and change of concentration of all nutrients, the solution requires a non-linear optimization algorithm with iterations.  
</p>

<p>
User defines a matrix of feed ingredients (rows), the nutrients to be used for a solution, and feeds’ nutrient contents (columns) along with correspondent dry matter and prices. This is performed by either editing pre-defined default matrix or by downloading, editing, and uploading back a spreadsheet. User also defines the acceptable range (minimum and maximum levels) of feed ingredients and nutrients in the solution. The tool is pre-loaded with NRC (2001) nutrient composition of common ingredients. The tool is live connected to Midwest US price data sources and therefore updates prices daily for ingredients that have such information (most of the feeds). Ingredients that do not have such information are noted with a faded color.
    </p>


<section>
    <h3>Acknowledgement</h3>
    <!-- 
    <div class="row">
        <div class="col-md-9">
            This project is supported by Agriculture and Food Research Initiative
            Competitive
            Grant No.
            <b>2011-68004-30340</b> from the USDA National Institute of Food and
            Agriculture.
        </div>
        <div class="col-md-3">
            <img src="/img/ack_usda_nifa.png">
        </div>
    </div>
    -->
</section>
