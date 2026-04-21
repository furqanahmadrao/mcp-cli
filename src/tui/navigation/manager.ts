/**
 * Navigation Manager
 * 
 * Handles keyboard input, view transitions, and navigation state.
 */

import { ViewType, NavigationContext, KeyboardInput } from '../types.js';

/**
 * Navigation manager class
 */
export class NavigationManager {
  private currentView: ViewType = 'menu';
  private viewHistory: ViewType[] = [];
  private selectedToolIndex: number = 0;
  private menuLevel: 'main' | 'servers' = 'main';
  
  private maxToolIndex: number = 0;
  
  /**
   * Constructor
   */
  constructor(initialView: ViewType = 'menu') {
    this.currentView = initialView;
    this.viewHistory = [initialView];
  }
  
  /**
   * Get current navigation context
   */
  getContext(): NavigationContext {
    return {
      currentView: this.currentView,
      selectedToolIndex: this.selectedToolIndex,
      menuLevel: this.menuLevel,
    };
  }
  
  /**
   * Set menu level
   */
  setMenuLevel(level: 'main' | 'servers'): void {
    this.menuLevel = level;
    this.selectedToolIndex = 0;
  }
  
  /**
   * Navigate to a specific view
   */
  navigateTo(view: ViewType): void {
    if (this.currentView !== view) {
      this.viewHistory.push(view);
      this.currentView = view;
      this.selectedToolIndex = 0;
    }
  }
  
  /**
   * Go back
   */
  goBack(): void {
    if (this.viewHistory.length > 1) {
      this.viewHistory.pop();
      this.currentView = this.viewHistory[this.viewHistory.length - 1];
    }
  }
  
  /**
   * Move selection up
   */
  moveUp(): void {
    if (this.selectedToolIndex > 0) {
      this.selectedToolIndex--;
    }
  }
  
  /**
   * Move selection down
   */
  moveDown(): void {
    if (this.selectedToolIndex < this.maxToolIndex) {
      this.selectedToolIndex++;
    }
  }
  
  /**
   * Set max index
   */
  setMaxToolIndex(max: number): void {
    this.maxToolIndex = Math.max(0, max - 1);
  }
  
  /**
   * Get selected index
   */
  getSelectedIndex(): number {
    return this.selectedToolIndex;
  }
  
  /**
   * Handle keyboard input - Simplified to arrows, enter, escape
   */
  handleKeyboard(input: KeyboardInput): { action?: string; view?: ViewType } {
    const { key } = input;
    
    switch (key.toLowerCase()) {
      // Navigation
      case 'arrowup':
        this.moveUp();
        return { action: 'selection_changed' };
      case 'arrowdown':
        this.moveDown();
        return { action: 'selection_changed' };
      case 'enter':
        return { action: 'select_item' };
      
      // Exit/Back
      case 'q':
        return { action: 'quit' };
      case 'backspace':
      case 'escape':
        this.goBack();
        return { action: 'view_changed' };
    }
    
    return {};
  }
}

/**
 * Create a navigation stack
 */
export class NavigationStack {
  private stack: ViewType[] = [];
  
  push(view: ViewType): void {
    this.stack.push(view);
  }
  
  pop(): ViewType | undefined {
    return this.stack.pop();
  }
  
  peek(): ViewType | undefined {
    return this.stack[this.stack.length - 1];
  }
  
  size(): number {
    return this.stack.length;
  }
  
  clear(): void {
    this.stack = [];
  }
  
  isEmpty(): boolean {
    return this.stack.length === 0;
  }
}
