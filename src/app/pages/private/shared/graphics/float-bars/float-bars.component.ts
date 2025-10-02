import { Component, Input } from '@angular/core';
import { GoogleChartsService } from '@private/shared/services/google-charts.service';
import { Subscription } from 'rxjs';
import { IFloatBarsGraphic } from './interface/float-bars-interface';
import { CurrencyPipe } from '@angular/common';
declare let google: any;
@Component({
    selector: 'app-float-bars',
    imports: [CurrencyPipe],
    templateUrl: './float-bars.component.html'
})
export class FloatBarsComponent {
  @Input({ required: true }) title: string = '';
  @Input() containerID: string = 'float-bars';
  @Input() data: IFloatBarsGraphic = {breakpoints: []};
  subscriptions: Subscription = new Subscription();

  constructor(private gooChartS: GoogleChartsService) {}

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.gooChartS.isScriptLoad$.subscribe((result) => 
      {
        if(this.data.breakpoints.length > 0){
        result === true && this.drawGraphic()
      }
    })
    );
  }

  drawGraphic() {
    const data = google.visualization.arrayToDataTable(
        [...this.data.breakpoints],
      true
    );
    const options = {
      legend: { position: 'none' },
      tooltip: {isHtml: true},
      candlestick: {
        fallingColor: { strokeWidth: 0, fill: '#D5D8DE' },
        risingColor: { strokeWidth: 0, fill: '#2E3C59' },
      },
      vAxis: {
        textStyle: {
          fontSize: 10,
          color: '#58637A',
        },
      },
      hAxis: {
        slantedText: false,
        color: '#58637A',
        textStyle: {
          fontSize: 10,
          color: '#58637A',
        },
      },
      chartArea: { left: 50, top: 20, width: '100%', height: '250' },
    };
    const chart = new google.visualization.CandlestickChart(
      document.getElementById(this.containerID)
    );    
     chart.draw(data, options);
     const currencyPipe: CurrencyPipe = new CurrencyPipe('en');
      google.visualization.events.addListener(chart, 'onmouseover', ({row}: any) => {
        const tooltip = document.getElementsByClassName('google-visualization-tooltip-item')[1];
        if(tooltip){
          if(row != 4){
            tooltip.innerHTML = `${currencyPipe.transform(this.data.breakpoints[row][1])} - ${currencyPipe.transform(this.data.breakpoints[row][3])}`;
          } else {
            tooltip.innerHTML = `${currencyPipe.transform(this.data.breakpoints[row][3])} - ${currencyPipe.transform(this.data.breakpoints[row][1])}`;
          }
        }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
