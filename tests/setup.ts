import * as pulumi from "@pulumi/pulumi";

/**
 * Sets up standard Pulumi mocks for unit testing.
 */
export function setupMocks() {
    pulumi.runtime.setMocks({
        newResource: (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } => {
            return {
                id: args.name + "_id",
                state: {
                    ...args.inputs,
                },
            };
        },
        call: (args: pulumi.runtime.MockCallArgs) => {
            return args.inputs;
        },
    });
}

/**
 * Helper to resolve the value of a Pulumi Output as a Promise.
 */
export function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
    return new Promise<T>((resolve) => {
        output.apply((val) => resolve(val));
    });
}
