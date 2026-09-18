import { Component } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Patient, PatientService } from '../services/patient.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  patients: Patient[] = [];
  searchTerm = '';
  selectedStatus = 'All';
  isEditModalOpen = false;
  isLoading = false;
  isToastOpen = false;
  toastMessage = '';
  editingPatient: Patient = this.emptyPatient();
  private stopWatching?: () => void;

  constructor(
    private patientService: PatientService,
    private loadingController: LoadingController,
    private toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
    this.stopWatching?.();
    this.stopWatching = this.patientService.watchPatients(
      (patients) => { this.patients = patients; },
      (error) => { this.presentToast(`Load failed: ${error.message}`, 'danger'); },
    );
  }

  ionViewDidLeave(): void { this.stopWatching?.(); }

  get filteredPatients(): Patient[] {
    const term = this.searchTerm.toLowerCase().trim();
    return this.patients.filter((patient) => {
      const matchesStatus = this.selectedStatus === 'All' || patient.status === this.selectedStatus;
      const matchesSearch = !term || `${patient.name} ${patient.email} ${patient.notes}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  async deletePatient(patient: Patient): Promise<void> {
    if (!patient.id) return;
    const loading = await this.loadingController.create({ message: 'Removing patient...' });
    await loading.present();
    try {
      await this.patientService.deletePatient(patient.id);
      await this.presentToast('Patient record deleted.', 'success');
    } catch {
      await this.presentToast('Unable to delete this record.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  openEditModal(patient: Patient): void {
    this.editingPatient = { ...patient };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void { this.isEditModalOpen = false; }

  async saveEdit(): Promise<void> {
    if (!this.editingPatient.id) return;
    this.isLoading = true;
    try {
      const { id, ...changes } = this.editingPatient;
      await this.patientService.updatePatient(id, changes);
      this.closeEditModal();
      await this.presentToast('Patient record updated.', 'success');
    } catch {
      await this.presentToast('Unable to update this record.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  handleRefresh(event: CustomEvent): void {
    window.setTimeout(() => event.detail.complete(), 500);
  }

  async reorderPatients(event: CustomEvent): Promise<void> {
    const moved = event.detail.complete(this.filteredPatients) as Patient[];
    await Promise.all(moved.map((patient, index) => patient.id ? this.patientService.updatePatient(patient.id, { order: index }) : Promise.resolve()));
    await this.presentToast('Patient order updated.', 'success');
  }

  async presentToast(message: string, color: string): Promise<void> {
    this.toastMessage = message;
    this.isToastOpen = true;
    const toast = await this.toastController.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }

  private static emptyPatient(): Patient {
    return { name: '', email: '', age: 0, gender: 'Female', status: 'Active', notes: '', order: 0 };
  }

  private emptyPatient(): Patient { return Tab2Page.emptyPatient(); }

}
