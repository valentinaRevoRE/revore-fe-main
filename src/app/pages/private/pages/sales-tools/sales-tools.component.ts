import { Component } from '@angular/core';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';

@Component({
	selector: 'app-sales-tools',
	imports: [HeaderComponent],
	template: `
		<app-header [data]="headerData" />
		<section class="content">
			<div class="placeholder">
				<h2>🛠️ Sales Tools</h2>
				<p>Esta sección está en desarrollo.</p>
				<p>Aquí estarán las herramientas de ventas para:</p>
				<ul>
					<li>Gestión de leads</li>
					<li>Calculadoras de precios</li>
					<li>Simuladores de crédito</li>
					<li>Reportes de ventas</li>
				</ul>
			</div>
		</section>
	`,
	styles: [`
		.content {
			padding: 20px;
		}
		.placeholder {
			background: white;
			padding: 40px;
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			text-align: center;
		}
		.placeholder h2 {
			color: #2c3e50;
			margin-bottom: 20px;
		}
		.placeholder ul {
			text-align: left;
			max-width: 300px;
			margin: 20px auto;
		}
		.placeholder li {
			margin: 8px 0;
		}
	`]
})
export class SalesToolsComponent {
	headerData: IHeader = { title: 'Sales Tools', margin_top: '45px' };
}




