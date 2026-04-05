-- CreateTable
CREATE TABLE "Score" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "last_Signature" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Score_address_key" ON "Score"("address");
