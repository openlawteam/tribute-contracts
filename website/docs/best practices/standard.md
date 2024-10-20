---
id: best_practices-standard
title: Convention when writing adapters and extensions
---

# INTRODUCTION 

Here we describe the conventions to write new adapters and extensions and explain why those conventions exist. 

# ADAPTER FUNCTION
For any function in an adapter that writes something (i.e not pure or view), the first parameter should always be the DaoRegistry address. 

This is important because this convention is used for the reimbursement adapter so it can extract the dao address from  `msg.data` 

# EVENT DEFINITION
like for functions in the adapter, each event that is not part of the DaoRegistry should have the dao address as its first param. This makes knowing which DAO is doing something much easier. 

