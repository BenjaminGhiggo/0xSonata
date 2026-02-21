import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  host: { style: 'display: block; width: 100%' },
  template: `<router-outlet />`,
})
export class App {}
