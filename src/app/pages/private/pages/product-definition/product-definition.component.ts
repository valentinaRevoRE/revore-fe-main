import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';

@Component({
	selector: 'app-product-definition',
	imports: [HeaderComponent, RouterLink],
	template: `
		<app-header [data]="headerData" />
		<section class="content">
			<div class="cards">
				<a class="card active" routerLink="plan-comercial">
					<h3>📈 Plan Comercial</h3>
					<p>Genera el plan comercial del proyecto con la metodología RevoRE:
					retroplanning digital, presupuesto por canal y proyección a 12 meses en PDF.</p>
					<span class="cta">Generar plan →</span>
				</a>
				<div class="card soon">
					<h3>🏗️ Configuración de proyectos</h3>
					<p>Tipologías, especificaciones técnicas, amenidades y servicios.</p>
					<span class="badge">Próximamente</span>
				</div>
			</div>
		</section>
	`,
	styles: [`
		.content { padding: 20px; }
		.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; max-width: 980px; }
		.card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); padding: 24px; text-decoration: none; display: block; }
		.card h3 { color: #2E3C59; margin: 0 0 10px; }
		.card p { color: #657A9B; font-size: 13.5px; line-height: 1.5; margin: 0 0 14px; }
		.card.active:hover { box-shadow: 0 4px 14px rgba(46,60,89,.18); }
		.cta { color: #DD7244; font-weight: 600; font-size: 14px; }
		.card.soon { opacity: .65; }
		.badge { background: #F7F8FA; color: #657A9B; font-size: 12px; padding: 3px 10px; border-radius: 12px; }
	`]
})
export class ProductDefinitionComponent {
	headerData: IHeader = { title: 'Product Definition', margin_top: '45px' };
}
