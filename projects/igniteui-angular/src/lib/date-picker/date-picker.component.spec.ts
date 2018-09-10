import { Component, ViewChild, DebugElement } from '@angular/core';
import { async, fakeAsync, TestBed, tick, flush, ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxDatePickerComponent, IgxDatePickerModule } from './date-picker.component';
import { IgxLabelDirective } from '../directives/label/label.directive';
import { IgxInputDirective } from '../directives/input/input.directive';
import { UIInteractions } from '../test-utils/ui-interactions.spec';

describe('IgxDatePicker', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxDatePickerTestComponent,
                IgxDatePickerWithWeekStartComponent,
                IgxDatePickerWithCustomFormatterComponent,
                IgxDatePickerWithPassedDateComponent,
                IgxDatePickerWIthLocaleComponent,
                IgxDatePickerNgModelComponent
            ],
            imports: [IgxDatePickerModule, FormsModule, NoopAnimationsModule]
        })
        .compileComponents();
    }));

    afterEach(() => {
        UIInteractions.clearOverlay();
    });

    describe('Base Tests', () => {
        let fixture: ComponentFixture<IgxDatePickerTestComponent>;
        let datePicker: IgxDatePickerComponent;

        beforeEach(() => {
            fixture = TestBed.createComponent(IgxDatePickerTestComponent);
            datePicker = fixture.componentInstance.datePicker;
            fixture.detectChanges();
        });

        it('Initialize a datepicker component', () => {
             expect(fixture.componentInstance).toBeDefined();
            expect(datePicker.displayData).toEqual('');
        });

        it('Initialize a datepicker component with id', () => {
            const domDatePicker = fixture.debugElement.query(By.css('igx-datePicker')).nativeElement;

            expect(datePicker.id).toContain('igx-datePicker-');
            expect(domDatePicker.id).toContain('igx-datePicker-');

            datePicker.id = 'customDatePicker';
            fixture.detectChanges();

            expect(datePicker.id).toBe('customDatePicker');
            expect(domDatePicker.id).toBe('customDatePicker');
        });

        it('Datepicker open/close event', fakeAsync(() => {
            const dom = fixture.debugElement;

            const target = dom.query(By.css('.igx-date-picker__input-date'));

            spyOn(datePicker.onOpen, 'emit');
            spyOn(datePicker.onClose, 'emit');

            target.nativeElement.dispatchEvent(new Event('click', { bubbles: true }));
            tick();

            expect(datePicker.onOpen.emit).toHaveBeenCalled();
            expect(datePicker.onOpen.emit).toHaveBeenCalledWith(datePicker);

            const overlay = dom.query(By.css('.igx-dialog'));
            overlay.nativeElement.dispatchEvent(new Event('click', { bubbles: true }));
            tick(350); // destroy timeout...
            expect(datePicker.onClose.emit).toHaveBeenCalled();
            expect(datePicker.onClose.emit).toHaveBeenCalledWith(datePicker);
        }));

        it('Datepicker onSelection event and selectDate method propagation', () => {
            spyOn(datePicker.onSelection, 'emit');
            const newDate: Date = new Date(2016, 4, 6);
            datePicker.selectDate(newDate);
            fixture.detectChanges();

            expect(datePicker.onSelection.emit).toHaveBeenCalled();
            expect(datePicker.value).toBe(newDate);
        });

        it('When labelVisability is set to false the label should not be visible', () => {
            let label = fixture.debugElement.query(By.directive(IgxLabelDirective));

            expect(label.nativeElement.innerText).toBe(datePicker.label);

            fixture.componentInstance.labelVisibility = false;
            fixture.detectChanges();

            label = fixture.debugElement.query(By.directive(IgxLabelDirective));
            expect(label).toBeNull();
        });

        it('When update label property it should reflect on the label text of the datepicker', () => {
            let label = fixture.debugElement.query(By.directive(IgxLabelDirective));
            expect(label.nativeElement.innerText).toEqual(datePicker.label);

            const expectedResult = 'new label';
            datePicker.label = expectedResult;
            fixture.detectChanges();

            label = fixture.debugElement.query(By.directive(IgxLabelDirective));
            expect(label.nativeElement.innerText).toEqual(expectedResult);
        });

        it('Visualize the label of the datepicker when initially is hidden', () => {
            fixture.componentInstance.labelVisibility = false;
            fixture.detectChanges();

            let label = fixture.debugElement.query(By.directive(IgxLabelDirective));
            expect(label).toBeNull();

            fixture.componentInstance.labelVisibility = true;
            fixture.detectChanges();

            label = fixture.debugElement.query(By.directive(IgxLabelDirective));
            expect(label).not.toBeNull();
        });

        it('Handling keyboard navigation with `space`(open) and `esc`(close) buttons', fakeAsync(() => {
            const datePickerDom = fixture.debugElement.query(By.css('igx-datepicker'));
            let overlayToggle = document.getElementsByTagName('igx-toggle');
            expect(overlayToggle.length).toEqual(0);

            UIInteractions.triggerKeyDownEvtUponElem('space', datePickerDom.nativeElement, false);
            flush();
            fixture.detectChanges();

            overlayToggle = document.getElementsByClassName('igx-toggle');
            expect(overlayToggle[0]).not.toBeNull();

            UIInteractions.triggerKeyDownEvtUponElem('Escape',  overlayToggle[0], true);
            flush();
            fixture.detectChanges();

            overlayToggle = document.getElementsByClassName('igx-toggle');
            expect(overlayToggle.length).toEqual(0);
        }));

        it('When datepicker is closed and the dialog disappear the focus should remain on the input',
        fakeAsync(() => {
            const datePickerDom = fixture.debugElement.query(By.css('igx-datepicker'));
            let overlayToggle = document.getElementsByTagName('igx-toggle');
            expect(overlayToggle.length).toEqual(0);

            UIInteractions.triggerKeyDownEvtUponElem('space', datePickerDom.nativeElement, false);
            flush();
            fixture.detectChanges();

            overlayToggle = document.getElementsByClassName('igx-toggle');
            expect(overlayToggle[0]).not.toBeNull();
            expect(overlayToggle[0]).not.toBeUndefined();

            UIInteractions.triggerKeyDownEvtUponElem('Escape',  overlayToggle[0], true);
            flush();
            fixture.detectChanges();

            const input = fixture.debugElement.query(By.directive(IgxInputDirective)).nativeElement;
            overlayToggle = document.getElementsByClassName('igx-toggle');
            expect(overlayToggle[0]).toEqual(undefined);
            expect(input).toEqual(document.activeElement);
        }));

    });

    describe('DatePicker with passed date', () => {
        let fixture: ComponentFixture<IgxDatePickerWithPassedDateComponent>;
        let datePicker: IgxDatePickerComponent;
        let inputTarget;

        beforeEach(() => {
            fixture = TestBed.createComponent(IgxDatePickerWithPassedDateComponent);
            datePicker = fixture.componentInstance.datePicker;
            fixture.detectChanges();
            inputTarget = fixture.debugElement.query(By.css('.igx-date-picker__input-date')).nativeElement;

        });

        it('@Input properties', () => {
            expect(datePicker.value).toEqual(new Date(2017, 7, 7));
        });

        it('Datepicker DOM input value', () => {
            const today = new Date(2017, 7, 7);
            const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

            expect(inputTarget.value).toEqual(formattedDate);
        });

        it('Datepicker custom locale(EN) date format', () => {
            const todayToEnLocale = new Date(2017, 7, 7).toLocaleDateString('en');
            expect(inputTarget.value).toEqual(todayToEnLocale);
        });

        it('Set formatOptions for month to be numeric', () => {
            const getMonthFromPickerDate = fixture.componentInstance.date.getMonth() + 1;

            inputTarget.dispatchEvent(new Event('click', { bubbles: true }));
            fixture.detectChanges();

            const getMonthFromCalendarHeader: any = fixture.debugElement.query(By.css('.igx-calendar__header-date')).nativeElement
                .children[1].innerText.substring(0, 1);

            expect(parseInt(getMonthFromCalendarHeader, 10)).toBe(getMonthFromPickerDate);
        });
    });

    it('Datepicker week start day (Monday)', () => {
        const fixture = TestBed.createComponent(IgxDatePickerWithWeekStartComponent);
        fixture.detectChanges();

        const dom = fixture.debugElement;
        const datePickerTarget = dom.query(By.css('.igx-date-picker__input-date'));

        datePickerTarget.nativeElement.dispatchEvent(new Event('click', { bubbles: true }));
        fixture.detectChanges();

        const firstDayValue = dom.query(By.css('.igx-calendar__label')).nativeElement.innerText;
        const expectedResult = 'Mon';

        expect(firstDayValue).toBe(expectedResult);
    });

    it('locale propagate calendar value (de-DE)', () => {
        const fixture = TestBed.createComponent(IgxDatePickerWIthLocaleComponent);
        fixture.detectChanges();

        const datePicker = fixture.componentInstance.datePicker;
        const dateConvertedToDeLocale = fixture.componentInstance.date.toLocaleDateString('de-DE');

        expect(datePicker.displayData).toBe(dateConvertedToDeLocale);
    });

    it('Datepicker custom formatter', () => {
        const fixture = TestBed.createComponent(IgxDatePickerWithCustomFormatterComponent);
        fixture.detectChanges();

        const compInstance = fixture.componentInstance;
        const datePicker = compInstance.datePicker;
        const dom = fixture.debugElement;
        const inputTarget = dom.query(By.css('.igx-date-picker__input-date')).nativeElement;
        const date = new Date(2017, 7, 7);
        const formattedDate = compInstance.customFormatter(date);

        expect(inputTarget.value).toEqual(formattedDate);
    });

    it('Value should respond when is bound through ngModel and selection through selectDate method is made.', fakeAsync(() => {
        const fix = TestBed.createComponent(IgxDatePickerNgModelComponent);
        const datePicker = fix.componentInstance.datePicker;
        let expectedRes = new Date(2011, 11, 11);
        fix.detectChanges();
        flush();

        expect(datePicker.value).toEqual(expectedRes);
        expectedRes = new Date(Date.now());
        datePicker.selectDate(expectedRes);

        tick();
        expect(datePicker.value).toEqual(expectedRes);

        const boundValue = fix.componentInstance.val;
        expect(boundValue).toEqual(expectedRes);
    }));

    it('Should be able to deselect using the API.', () => {
        const fix = TestBed.createComponent(IgxDatePickerTestComponent);
        const datePicker = fix.componentInstance.datePicker;
        fix.detectChanges();

        const date = new Date(Date.now());
        datePicker.selectDate(date);
        fix.detectChanges();

        expect(datePicker.value).toBe(date);

        datePicker.deselectDate();
        fix.detectChanges();

        expect(datePicker.value).toBe(null);
    });
});

@Component({
    template: `
        <igx-datePicker [formatter]="customFormatter" [value]=date></igx-datePicker>
    `
})
export class IgxDatePickerWithCustomFormatterComponent {
    @ViewChild(IgxDatePickerComponent) public datePicker: IgxDatePickerComponent;

    public date = new Date(2017, 7, 7);
    public customFormatter = (_: Date) => (
        `${_.getFullYear()}/${_.getMonth()}/${_.getDate()}`
    )
}

@Component({
    template: `
        <igx-datePicker [value]="date" [weekStart]="1"></igx-datePicker>
    `
})
export class IgxDatePickerWithWeekStartComponent {
    public date: Date = new Date(2017, 6, 8);
    @ViewChild(IgxDatePickerComponent) public datePicker: IgxDatePickerComponent;
}

@Component({
    template: `
        <igx-datePicker [labelVisibility]="labelVisibility"></igx-datePicker>
    `
})
export class IgxDatePickerTestComponent {
    @ViewChild(IgxDatePickerComponent) public datePicker: IgxDatePickerComponent;

    public labelVisibility = true;
}

@Component({
    template: `
        <igx-datePicker [value]="date" [formatOptions]="formatOptions"></igx-datePicker>
    `
})
export class IgxDatePickerWithPassedDateComponent {
    public date: Date = new Date(2017, 7, 7);
    public formatOptions = {
        day: 'numeric',
        month: 'numeric',
        weekday: 'short',
        year: 'numeric'
    };
    @ViewChild(IgxDatePickerComponent) public datePicker: IgxDatePickerComponent;
}

@Component({
    template: `
        <igx-datePicker [value]="date" [locale]="'de-DE'"></igx-datePicker>
    `
})
export class IgxDatePickerWIthLocaleComponent {
    public date: Date = new Date(2017, 7, 7);
    @ViewChild(IgxDatePickerComponent) public datePicker: IgxDatePickerComponent;
}

@Component({
    template: `
        <igx-datePicker [(ngModel)]="val"></igx-datePicker>
    `
})
export class IgxDatePickerNgModelComponent {
    public val: Date = new Date(2011, 11, 11);
    @ViewChild(IgxDatePickerComponent) public datePicker: IgxDatePickerComponent;
}
