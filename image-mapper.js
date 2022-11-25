fetch('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo')
  .then((response) => response.json())
  .then((data) => {

    document.getElementById("loader").style.display = "none";

    let remoteapidata = data['Time Series (Daily)'];
    var parsedData = [];
        Object.keys(remoteapidata).forEach(key => {          
            parsedData.push({            
            date: new Date(key),             
            open: +remoteapidata[key]['1. open'],
            high: +remoteapidata[key]['2. high'],
            low: +remoteapidata[key]['3. low'],
            close: +remoteapidata[key]['4. close'],              
        });    
    });
  
    initialiseChart(parsedData); 

  });


  function initialiseChart(data){
 
    data = data.filter(
        row => row['high'] && row['low'] && row['close'] && row['open']
      );

      thisYearStartDate = new Date(2022, 0, 1);

      // filter out data based on time period
      data = data.filter(row => {
        if (row['date']) {
          return row['date'] >= thisYearStartDate;
        }
      });
      
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };
      const width = window.innerWidth - margin.left - margin.right; // Use the window's width
      const height = window.innerHeight - margin.top - margin.bottom; // Use the window's height
    
      // find data range
      const xMin = d3.min(data, d => {
        return d['date'];
      });
    
      const xMax = d3.max(data, d => {
        return d['date'];
      });
    
      const yMin = d3.min(data, d => {
        return d['close'];
      });
    
      const yMax = d3.max(data, d => {
        return d['close'];
      });
    
      // scale using range
      const xScale = d3
        .scaleTime()
        .domain([xMin, xMax])
        .range([0, width]);
    
      const yScale = d3
        .scaleLinear()
        .domain([yMin - 5, yMax])
        .range([height, 0]);
    
      // add chart SVG to the page
      const svg = d3
        .select('#chart')
        .append('svg')
        .attr('width', width + margin['left'] + margin['right'])
        .attr('height', height + margin['top'] + margin['bottom'])
        .call(responsivefy)
        .append('g')
        .attr('transform', `translate(${margin['left']}, ${margin['top']})`);
    
      // create the axes component
      svg
        .append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
      svg
        .append('g')
        .attr('id', 'yAxis')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yScale));

         // generates lines when called
        const line = d3
        .line()
        .x(d => {
            return xScale(d['date']);
        })
        .y(d => {
            return yScale(d['close']);
        });

        svg
        .append('path')
        .data([data]) // binds data to the line
        .style('fill', 'none')
        .attr('id', 'priceChart')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', '1.5')
        .attr('d', line);

        
         // renders x and y crosshair
        const focus = svg
        .append('g')
        .attr('class', 'focus')
        .style('display', 'none');

        focus.append('circle').attr('r', 4.5);
        focus.append('line').classed('x', true);
        focus.append('line').classed('y', true);

        svg
        .append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', () => focus.style('display', null))
        .on('mouseout', () => focus.style('display', 'none'))
        .on('mousemove', generateCrosshair);

        d3.select('.overlay').style('fill', 'none');
        d3.select('.overlay').style('pointer-events', 'all');

        d3.selectAll('.focus line').style('fill', 'none');
        d3.selectAll('.focus line').style('stroke', '#67809f');
        d3.selectAll('.focus line').style('stroke-width', '1.5px');
        d3.selectAll('.focus line').style('stroke-dasharray', '3 3');

        /* mouseover function to generate crosshair */
        function generateCrosshair() {

            const correspondingDate = xScale.invert(d3.mouse(this)[0]);                   
            let currentPoint = [];
            const correspondingDatefromat = formatDate(correspondingDate);            

            Object.keys(data).forEach(key => {

              let g2 = formatDate(data[key].date); 
              if(correspondingDatefromat == g2){                
                currentPoint = data[key];               
              }

            });

            focus.attr(
            'transform',
            `translate(${xScale(currentPoint['date'])}, ${yScale(
                currentPoint['close']
            )})`
            );

            focus
            .select('line.x')
            .attr('x1', 0)
            .attr('x2', width - xScale(currentPoint['date']))
            .attr('y1', 0)
            .attr('y2', 0);

            focus
            .select('line.y')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', height - yScale(currentPoint['close']));

            // updates the legend to display the date, open, close, high, low, and volume of the selected mouseover area
            updateLegends(currentPoint);

            
        }

               /* Legends */
        function updateLegends(currentData) {
            d3.selectAll('.lineLegend').remove();

            const legendKeys = Object.keys(data[0]);

            const lineLegend = svg
            .selectAll('.lineLegend')
            .data(legendKeys)
            .enter()
            .append('g')
            .attr('class', 'lineLegend')
            .attr('transform', (d, i) => {
                return `translate(0, ${i * 20})`;
            });
            lineLegend
            .append('text')
            .text(d => {
                if (d === 'date') {
                return `${d}: ${currentData[d].toLocaleDateString()}`;
                } else if (
                d === 'high' ||
                d === 'low' ||
                d === 'open' ||
                d === 'close'
                ) {
                return `${d}: ${currentData[d].toFixed(2)}`;
                } else {
                return `${d}: ${currentData[d]}`;
                }
            })
            .style('fill', 'white')
            .attr('transform', 'translate(15,9)'); //align texts with boxes
        };


        svg.on("click", function() {
 
            let coords = d3.mouse(this);   
            let sym = d3.symbol()
            .type(d3.symbolCross).size(100);

            const symbolDate = xScale.invert(d3.mouse(this)[0]);
            const symbolDatefromat = formatDate(symbolDate);
            let symbolcurrentPoint = [];

            Object.keys(data).forEach(key => {
              var symbolg2 = formatDate(data[key].date);
              if(symbolDatefromat == symbolg2){                
                symbolcurrentPoint = data[key];
              }
            });

            let crossysmbol = svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("path")
            .attr("d", sym)
            .attr("transform", "translate(" + coords[0] + "," + coords[1] + ")")
            .style("fill", "white");

            // create a tooltip
            let Tooltip = d3.select("#div_template")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")

            let tooltip = "open "+ symbolcurrentPoint['open'] +" close "+symbolcurrentPoint['close']+" high "+symbolcurrentPoint['high']+" low "+symbolcurrentPoint['low'];
            crossysmbol.on("mouseover", function(d) {

              if (typeof symbolcurrentPoint['open'] === 'undefined') {
                tooltip = "No Data";
              }
              
              Tooltip.style("opacity", 0.7)
                .html(tooltip)
                .style("left", (d3.event.pageX-25) + "px")
                .style("top", (d3.event.pageY-35) + "px")
              })
              .on("mouseout", function(d) {
                  Tooltip.style("opacity", 0)
              })

        }) 

        function formatDate(date){
            let curdate = new Date(date);
            let dd = curdate.getDate();
            let mm = curdate.getMonth()+1; 
            let yyyy = curdate.getFullYear();
            return yyyy+"-"+mm+"-"+dd;
        }


  }


  function responsivefy(svg) {
   
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    d3.select(window).on("resize." + container.attr("id"), resize);

    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}
       

        
