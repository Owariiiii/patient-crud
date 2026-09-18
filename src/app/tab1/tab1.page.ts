import { Component } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  newPatient = {
    name: '',
    email: '',
    age: 0,
    gender: 'Female' as 'Female' | 'Male' | 'Other',
    status: 'Active' as 'Active' | 'Follow-up' | 'Discharged',
    notes: '',
  };

  constructor(
    private patientService: PatientService,
    private loadingController: LoadingController,
    private toastController: ToastController,
  ) {}

  async addPatient(): Promise<void> {
    if (!this.newPatient.name.trim() || !this.newPatient.email.trim() || !this.newPatient.age) {
      await this.showToast('Please complete the required patient fields.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Saving patient...' });
    await loading.present();
    try {
      await this.patientService.addPatient({ ...this.newPatient, name: this.newPatient.name.trim() });
      this.newPatient = { name: '', email: '', age: 0, gender: 'Female', status: 'Active', notes: '' };
      await this.showToast('Patient added successfully.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Firestore error';
      await this.showToast(`Save failed: ${message}`, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2200, color, position: 'top' });
    await toast.present();
  }

}
