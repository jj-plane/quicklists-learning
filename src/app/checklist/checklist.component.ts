import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgModule } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ChecklistService } from '../shared/data-access/checklist.service';
import { filter, map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';
import { FormModalComponentModule } from '../shared/ui/form-modal.component';
import { ChecklistItemService } from './data-access/checklistItem.service';
import { Checklist } from '../shared/interfaces/checklist';
import { ChecklistItemListComponentModule } from './ui/checklist-item-list.component';
@Component({
  selector: 'app-checklist',
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/"></ion-back-button>
          </ion-buttons>
          <ion-title>
            {{ vm.checklist.title }}
          </ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="resetChecklistItems(vm.checklist.id)">
              <ion-icon name="refresh" slot="icon-only"></ion-icon>
            </ion-button>
            <ion-button (click)="formModalIsOpen$.next(true)">
              <ion-icon name="add" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
      <app-checklist-item-list
          [checklistItems]="vm.items"
          (toggle)="toggleChecklistItem($event)"
        ></app-checklist-item-list>
        <ion-modal
          [isOpen]="vm.formModalIsOpen"
          [canDismiss]="true"
          (ionModalDidDismiss)="formModalIsOpen$.next(false)"
        >
          <ng-template>
            <app-form-modal
              title="Create item"
              [formGroup]="checklistItemForm"
              (save)="addChecklistItem(vm.checklist.id)"
            ></app-form-modal>
          </ng-template>
        </ion-modal>
      </ion-content>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class ChecklistComponent {
    formModalIsOpen$ = new BehaviorSubject<boolean>(false);

    checklistItemForm = this.fb.nonNullable.group({
        title: ['', Validators.required],
    });

    checklistAndItems$ = this.route.paramMap.pipe(
        switchMap((params) =>
          combineLatest([
            this.checklistService
              .getChecklistById(params.get('id') as string)
              .pipe(filter((checklist): checklist is Checklist => !!checklist)),
            this.checklistItemService.getItemsByChecklistId(
              params.get('id') as string
            ),
          ])
        )
    );

    toggleChecklistItem(itemId: string) {
        this.checklistItemService.toggle(itemId);
    }

    resetChecklistItems(checklistId: string) {
        this.checklistItemService.reset(checklistId);
    }

    vm$ = combineLatest([this.checklistAndItems$, this.formModalIsOpen$]).pipe(
        map(([[checklist, items], formModalIsOpen]) => ({
          checklist,
          items,
          formModalIsOpen,
        }))
    );

    constructor(
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private checklistService: ChecklistService,
        private checklistItemService: ChecklistItemService
      ) {}
      addChecklistItem(checklistId: string) {
        this.checklistItemService.add(
          this.checklistItemForm.getRawValue(),
          checklistId
        );
      }
}
@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormModalComponentModule,
    ChecklistItemListComponentModule,
    RouterModule.forChild([
      {
        path: '',
        component: ChecklistComponent,
      },
    ]),
  ],
  declarations: [ChecklistComponent],
})
export class ChecklistComponentModule {}