import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dispatch, SetStateAction } from "react";

interface AuthTabsProps {
  isLogin: boolean;
  setIsLogin: Dispatch<SetStateAction<boolean>>;
}

const AuthTabs = ({ isLogin, setIsLogin }: AuthTabsProps) => {
  const tabs = [
    {
      name: "Log In",
      value: "log-in",
    },
    {
      name: "Sign Up",
      value: "sign-up",
    },
  ];

  return (
    <div className="w-full flex justify-center my-3">
      <Tabs
        className="w-9/12"
        value={isLogin ? "log-in" : "sign-up"}
        onValueChange={(value) => setIsLogin(value === "log-in")}
      >
        <TabsList className="w-full py-5 px-1 bg-muted">
          {tabs.map((tab) => (
            <TabsTrigger className="py-4" key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default AuthTabs;
