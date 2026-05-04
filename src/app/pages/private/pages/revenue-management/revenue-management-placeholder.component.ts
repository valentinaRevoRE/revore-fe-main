import { Component } from '@angular/core';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';

@Component({
	selector: 'app-revenue-management-placeholder',
	imports: [HeaderComponent],
	template: `
		<app-header [data]="headerData" />
		<section class="content">
			<div class="placeholder">
				<h2>📊 Revenue Management</h2>
				<p>Esta sección está en desarrollo.</p>
				<p>Aquí podrás gestionar el modelo financiero de tus proyectos:</p>
				<ul>
					<li>Dashboard con métricas clave de revenue</li>
					<li>Lista de precios por tipología</li>
					<li>Modelo de apreciación</li>
					<li>Modelo de revenue proyectado vs realizado</li>
					<li>Gráficas de desempeño financiero</li>
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
export class RevenueManagementPlaceholderComponent {
	headerData: IHeader = { title: 'Revenue Management', margin_top: '45px' };
}
