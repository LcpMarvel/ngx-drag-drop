import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DndDraggableDirective, DndDragImageRefDirective, } from './dnd-draggable.directive';
import { DndDropzoneDirective, DndPlaceholderRefDirective, } from './dnd-dropzone.directive';
import { DndHandleDirective } from './dnd-handle.directive';
import * as i0 from "@angular/core";
export class DndModule {
}
DndModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
DndModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.2.6", ngImport: i0, type: DndModule, declarations: [DndDraggableDirective,
        DndDropzoneDirective,
        DndHandleDirective,
        DndPlaceholderRefDirective,
        DndDragImageRefDirective], imports: [CommonModule], exports: [DndDraggableDirective,
        DndDropzoneDirective,
        DndHandleDirective,
        DndPlaceholderRefDirective,
        DndDragImageRefDirective] });
DndModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndModule, imports: [CommonModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        DndDraggableDirective,
                        DndDropzoneDirective,
                        DndHandleDirective,
                        DndPlaceholderRefDirective,
                        DndDragImageRefDirective,
                    ],
                    exports: [
                        DndDraggableDirective,
                        DndDropzoneDirective,
                        DndHandleDirective,
                        DndPlaceholderRefDirective,
                        DndDragImageRefDirective,
                    ],
                    imports: [CommonModule],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2RuZC9zcmMvbGliL2RuZC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUNMLHFCQUFxQixFQUNyQix3QkFBd0IsR0FDekIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQ0wsb0JBQW9CLEVBQ3BCLDBCQUEwQixHQUMzQixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDOztBQW1CNUQsTUFBTSxPQUFPLFNBQVM7O3NHQUFULFNBQVM7dUdBQVQsU0FBUyxpQkFmbEIscUJBQXFCO1FBQ3JCLG9CQUFvQjtRQUNwQixrQkFBa0I7UUFDbEIsMEJBQTBCO1FBQzFCLHdCQUF3QixhQVNoQixZQUFZLGFBTnBCLHFCQUFxQjtRQUNyQixvQkFBb0I7UUFDcEIsa0JBQWtCO1FBQ2xCLDBCQUEwQjtRQUMxQix3QkFBd0I7dUdBSWYsU0FBUyxZQUZWLFlBQVk7MkZBRVgsU0FBUztrQkFqQnJCLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFO3dCQUNaLHFCQUFxQjt3QkFDckIsb0JBQW9CO3dCQUNwQixrQkFBa0I7d0JBQ2xCLDBCQUEwQjt3QkFDMUIsd0JBQXdCO3FCQUN6QjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1AscUJBQXFCO3dCQUNyQixvQkFBb0I7d0JBQ3BCLGtCQUFrQjt3QkFDbEIsMEJBQTBCO3dCQUMxQix3QkFBd0I7cUJBQ3pCO29CQUNELE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQztpQkFDeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIERuZERyYWdnYWJsZURpcmVjdGl2ZSxcbiAgRG5kRHJhZ0ltYWdlUmVmRGlyZWN0aXZlLFxufSBmcm9tICcuL2RuZC1kcmFnZ2FibGUuZGlyZWN0aXZlJztcbmltcG9ydCB7XG4gIERuZERyb3B6b25lRGlyZWN0aXZlLFxuICBEbmRQbGFjZWhvbGRlclJlZkRpcmVjdGl2ZSxcbn0gZnJvbSAnLi9kbmQtZHJvcHpvbmUuZGlyZWN0aXZlJztcbmltcG9ydCB7IERuZEhhbmRsZURpcmVjdGl2ZSB9IGZyb20gJy4vZG5kLWhhbmRsZS5kaXJlY3RpdmUnO1xuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtcbiAgICBEbmREcmFnZ2FibGVEaXJlY3RpdmUsXG4gICAgRG5kRHJvcHpvbmVEaXJlY3RpdmUsXG4gICAgRG5kSGFuZGxlRGlyZWN0aXZlLFxuICAgIERuZFBsYWNlaG9sZGVyUmVmRGlyZWN0aXZlLFxuICAgIERuZERyYWdJbWFnZVJlZkRpcmVjdGl2ZSxcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIERuZERyYWdnYWJsZURpcmVjdGl2ZSxcbiAgICBEbmREcm9wem9uZURpcmVjdGl2ZSxcbiAgICBEbmRIYW5kbGVEaXJlY3RpdmUsXG4gICAgRG5kUGxhY2Vob2xkZXJSZWZEaXJlY3RpdmUsXG4gICAgRG5kRHJhZ0ltYWdlUmVmRGlyZWN0aXZlLFxuICBdLFxuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbn0pXG5leHBvcnQgY2xhc3MgRG5kTW9kdWxlIHt9XG4iXX0=