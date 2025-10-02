import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {  RouterLink } from '@angular/router';

@Component({
    selector: 'app-otp',
    imports: [RouterLink, ReactiveFormsModule],
    templateUrl: './otp.component.html',
    styleUrl: './otp.component.scss'
})
export class OtpComponent {}
