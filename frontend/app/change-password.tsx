import { useState } from "react"
import { View, TextInput } from "react-native"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { changePassword } from "@/lib/api"
import { useRouter } from "expo-router"

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleChangePassword = async () => {
    try {
      const result = await changePassword({ oldPassword, newPassword })
      toast({ title: "Success", description: result.message, variant: "success" })
      router.back()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Old Password" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
      <TextInput placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      <Button onPress={handleChangePassword}>Change Password</Button>
    </View>
  )
}
