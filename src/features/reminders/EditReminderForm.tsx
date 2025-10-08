import { ReminderForm } from "./ReminderForm";
import { Reminder } from "./remindersSlice";

interface EditReminderFormProps {
  reminder: Reminder;
  onCancel: () => void;
}

export const EditReminderForm: React.FC<EditReminderFormProps> = ({ reminder, onCancel }) => {
  return <ReminderForm mode="edit" reminder={reminder} onSave={onCancel} />;
};