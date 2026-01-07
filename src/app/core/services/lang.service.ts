import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LangService {
  constructor(private translate: TranslateService) {}

  init(defaultLang = 'vi') {
    this.translate.setDefaultLang(defaultLang);
    this.translate.use(defaultLang);
  }

  switch(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  get current() {
    return this.translate.currentLang;
  }
}
