import { useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, User, GraduationCap, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { profile, setProfile } = useAppState();
  const { toast } = useToast();
  const [form, setForm] = useState(profile);
  const [goalInput, setGoalInput] = useState("");

  const handleSave = () => {
    setProfile(form);
    toast({ title: "Profile saved!", description: "Your details have been updated." });
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    setForm({ ...form, goals: [...form.goals, goalInput.trim()] });
    setGoalInput("");
  };

  const removeGoal = (index: number) => {
    setForm({ ...form, goals: form.goals.filter((_, i) => i !== index) });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-sm text-muted-foreground">Personalize your study experience</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border space-y-5"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <User size={18} className="text-primary" /> Personal Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 border border-border space-y-5"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" /> Academic Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Your university/school" />
            </div>
            <div className="space-y-2">
              <Label>Course / Major</Label>
              <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="e.g., Computer Science" />
            </div>
            <div className="space-y-2">
              <Label>Semester / Year</Label>
              <Input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="e.g., 3rd Semester" />
            </div>
            <div className="space-y-2">
              <Label>Study Hours Per Day</Label>
              <Input type="number" min={1} max={16} value={form.studyHoursPerDay} onChange={(e) => setForm({ ...form, studyHoursPerDay: parseInt(e.target.value) || 6 })} />
            </div>
            <div className="space-y-2">
              <Label>Wake Up Time</Label>
              <Input type="time" value={form.wakeUpTime} onChange={(e) => setForm({ ...form, wakeUpTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sleep Time</Label>
              <Input type="time" value={form.sleepTime} onChange={(e) => setForm({ ...form, sleepTime: e.target.value })} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 border border-border space-y-4"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Target size={18} className="text-primary" /> Goals
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="Add a goal (e.g., Score 90% in Math)"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
            />
            <Button onClick={addGoal} variant="outline">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.goals.map((goal, i) => (
              <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-2">
                {goal}
                <button onClick={() => removeGoal(i)} className="hover:text-destructive">×</button>
              </span>
            ))}
          </div>
        </motion.div>

        <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
          <Save size={16} className="mr-2" /> Save Profile
        </Button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
