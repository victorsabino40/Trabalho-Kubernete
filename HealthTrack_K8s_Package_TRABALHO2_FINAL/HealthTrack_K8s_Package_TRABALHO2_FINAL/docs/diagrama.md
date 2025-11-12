# Diagrama de Implantação (Mermaid)

```mermaid
flowchart LR
  subgraph User[Usuário]
    BROWSER[Browser]
  end

  subgraph K8s[Cluster Kubernetes (kind, 1 nó)]
    subgraph NS_F[Namespace: frontend]
      FE_DEP[Deployment: frontend-deploy (3)]
      FE_SVC[(Service: frontend-svc\nNodePort:30080)]
    end

    subgraph NS_B[Namespace: backend]
      BE_DEP[Deployment: backend-deploy (2)]
      BE_SVC[(Service: backend-svc\nNodePort:30000 -> 3000)]
    end

    subgraph NS_D[Namespace: database]
      DB_DEP[Deployment: db-deploy (1)]
      DB_SVC[(Service: db-svc\nClusterIP:5432)]
      PV[(PV: db-pv)]
      PVC[(PVC: db-pvc)]
    end
  end

  BROWSER -- HTTP 30080 --> FE_SVC
  FE_SVC -- HTTP 80 --> FE_DEP
  BROWSER -- HTTP 3000 --> BE_SVC
  BE_SVC -- TCP 5432 --> DB_SVC
  DB_DEP -- monta --> PVC
  PVC -- vincula --> PV
```
