import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BrowserModule, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  resPerHour = 1200 + 1620;
  cpPerDay = 153;
  currentCp = 700;
  currentRes = 0;
  hoursSinceStart = 24;
  submitted = true; // show the summary immediately
  showInputs = false;

  lastPartyTime: number | null = null;
  partyCooldownHours = 24;

  actionLog: string[] = [];

  calculate() {
    this.submitted = true;
  }

  canRunParty(): boolean {
    if (this.lastPartyTime === null) return true;
    return this.hoursSinceStart - this.lastPartyTime >= this.partyCooldownHours;
  }

  runParty(): void {
    if (!this.canRunParty()) return;

    if (this.currentRes < 20330) {
      const msg = `❌ [${this.hoursSinceStart}h] Not enough resources to run a party.`;
      this.actionLog.push(msg);
      alert('Not enough resources to run a party!');
      return;
    }

    this.currentRes -= 20330;
    this.currentCp += this.cpPerDay;
    this.lastPartyTime = this.hoursSinceStart;

    const msg = `🎉 [${this.hoursSinceStart}h] Ran party: -20330 res, +${this.cpPerDay} CP`;
    this.actionLog.push(msg);
  }

  get nextPartyAvailableIn(): number {
    if (this.lastPartyTime === null) return 0;
    const cooldownLeft =
      this.partyCooldownHours - (this.hoursSinceStart - this.lastPartyTime);
    return cooldownLeft > 0 ? cooldownLeft : 0;
  }

  buildingName = '';
  buildingResCost = 0;
  buildingCpBonus = 0;

  addResAmount = 0;
  addCpAmount = 0;

  advanceTime(hours: number): void {
    const resGained = this.resPerHour * hours;
    const cpGained = (this.cpPerDay / 24) * hours;

    this.currentRes += resGained;
    this.currentCp += cpGained;
    this.hoursSinceStart += hours;

    this.actionLog.push(
      `⏩ Advanced ${hours}h: +${resGained} res, +${cpGained.toFixed(2)} CP`
    );

    this.collapseLog();
  }

  collapseLog(): void {
    const collapsed: string[] = [];
    let pendingHours = 0;
    let pendingRes = 0;
    let pendingCp = 0;
    const advanceRegex = /^⏩ Advanced (\d+)h: \+(\d+) res, \+([\d.]+) CP$/;

    for (const log of this.actionLog) {
      const match = log.match(advanceRegex);

      if (match) {
        const hours = parseInt(match[1], 10);
        const res = parseInt(match[2], 10);
        const cp = parseFloat(match[3]);

        pendingHours += hours;
        pendingRes += res;
        pendingCp += cp;
      } else {
        if (pendingHours > 0) {
          collapsed.push(
            `⏩ Advanced ${pendingHours}h: +${pendingRes} res, +${pendingCp.toFixed(
              2
            )} CP`
          );
          pendingHours = pendingRes = pendingCp = 0;
        }
        collapsed.push(log);
      }
    }

    if (pendingHours > 0) {
      collapsed.push(
        `⏩ Advanced ${pendingHours}h: +${pendingRes} res, +${pendingCp.toFixed(
          2
        )} CP`
      );
    }

    this.actionLog = collapsed;
  }

  buildBuilding(): void {
    if (this.currentRes < this.buildingResCost) {
      alert('Not enough resources to build.');
      return;
    }

    this.currentRes -= this.buildingResCost;
    this.cpPerDay += this.buildingCpBonus;

    this.actionLog.push(
      `🏗️ Built "${this.buildingName}": -${this.buildingResCost} res, +${this.buildingCpBonus} CP/day`
    );

    this.buildingName = '';
    this.buildingResCost = 0;
    this.buildingCpBonus = 0;
  }

  addResources(): void {
    this.currentRes += this.addResAmount;
    this.actionLog.push(`➕ Added ${this.addResAmount} resources`);
    this.addResAmount = 0;
  }

  addCp(): void {
    this.currentCp += this.addCpAmount;
    this.actionLog.push(`➕ Added ${this.addCpAmount} CP`);
    this.addCpAmount = 0;
  }

  getCurrentState(): AppState {
    return {
      resPerHour: this.resPerHour,
      cpPerDay: this.cpPerDay,
      currentCp: this.currentCp,
      currentRes: this.currentRes,
      hoursSinceStart: this.hoursSinceStart,
      lastPartyTime: this.lastPartyTime,
      actionLog: this.actionLog,
    };
  }

  encodeState(): string {
    const state = this.getCurrentState();
    return encodeURIComponent(JSON.stringify(state));
  }

  decodeState(encoded: string): any {
    try {
      const json = decodeURIComponent(encoded);
      return JSON.parse(json);
    } catch (error) {
      console.error('❌ Failed to decode state:', error);
      return null;
    }
  }

  copyShareableLink(): void {
    const encoded = this.encodeState();
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  }

  loadState(state: AppState): void {
    this.resPerHour = state.resPerHour;
    this.cpPerDay = state.cpPerDay;
    this.currentCp = state.currentCp;
    this.currentRes = state.currentRes;
    this.hoursSinceStart = state.hoursSinceStart;
    this.lastPartyTime = state.lastPartyTime;
    this.actionLog = state.actionLog;
  }

  ngOnInit(): void {
    const stateParam = new URLSearchParams(window.location.search).get('state');
    if (stateParam) {
      try {
        const state = this.decodeState(stateParam);
        if (!state) return;
        this.loadState(state);
        this.submitted = true;
      } catch (e) {
        console.warn('Invalid state in URL:', e);
      }
    }
  }
}

interface AppState {
  resPerHour: number;
  cpPerDay: number;
  currentCp: number;
  currentRes: number;
  hoursSinceStart: number;
  lastPartyTime: number | null;
  actionLog: string[];
}
