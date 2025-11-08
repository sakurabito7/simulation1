import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState } from './models/simulation-config.model';
import { StartConfig } from './components/start-config/start-config';
import { Simulation } from './components/simulation/simulation';
import { Result } from './components/result/result';

enum AppScreen {
  START_CONFIG = 'START_CONFIG',
  SIMULATION = 'SIMULATION',
  RESULT = 'RESULT'
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, StartConfig, Simulation, Result],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  AppScreen = AppScreen;
  currentScreen: AppScreen = AppScreen.START_CONFIG;

  simulationConfig?: SimulationConfig;
  simulationState?: SimulationState;

  onStartSimulation(config: SimulationConfig) {
    this.simulationConfig = config;
    this.currentScreen = AppScreen.SIMULATION;
  }

  onSimulationComplete(state: SimulationState) {
    this.simulationState = state;
    this.currentScreen = AppScreen.RESULT;
  }

  onBackToStart() {
    this.currentScreen = AppScreen.START_CONFIG;
    // simulationConfigは保持（初期画面の値を維持）
    this.simulationState = undefined;
  }
}
