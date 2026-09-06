import { Suspense } from "react";
import SignInContent from "@/components/login/signincontent";
import BrandedLoader from "@/components/shared/BrandedLoader";

const SignInPage = () => {
  return (
    <Suspense fallback={<BrandedLoader />}>
      <SignInContent />
    </Suspense>
  );
};

export default SignInPage;
